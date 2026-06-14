import ldap, { Client, SearchOptions } from 'ldapjs';
import { LDAPSSOConfig } from '../types';

export interface LDAPUser {
  dn: string;
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  groups: string[];
  memberOf?: string[];
}

export interface LDAPGroup {
  dn: string;
  name: string;
  description?: string;
  members: string[];
}

/**
 * LDAP/Active Directory SSO Provider implementation
 */
export class LDAPSSOProvider {
  private config: LDAPSSOConfig;

  constructor(config: LDAPSSOConfig) {
    this.config = config;
  }

  /**
   * Create LDAP client
   */
  private createClient(): Client {
    const options: ldap.ClientOptions = {
      url: this.config.serverUrl,
      timeout: this.config.timeout || 30000,
      connectTimeout: this.config.timeout || 30000,
    };

    if (this.config.tlsOptions) {
      options.tlsOptions = {
        rejectUnauthorized: this.config.tlsOptions.rejectUnauthorized,
      };
    }

    return ldap.createClient(options);
  }

  /**
   * Bind to LDAP server (authenticate)
   */
  async bind(username: string, password: string): Promise<LDAPUser | null> {
    const client = this.createClient();

    return new Promise((resolve, reject) => {
      // Construct user DN
      const userDn = this.constructUserDn(username);

      // Bind as user
      client.bind(userDn, password, async (err) => {
        if (err) {
          client.unbind();
          if (err.name === 'InvalidCredentialsError') {
            resolve(null); // Invalid credentials
          } else {
            reject(err);
          }
          return;
        }

        // Search for user details
        try {
          const user = await this.getUserByDn(client, userDn);
          client.unbind();
          resolve(user);
        } catch (searchErr) {
          client.unbind();
          reject(searchErr);
        }
      });
    });
  }

  /**
   * Bind with service account and search for user
   */
  async bindAndSearch(username: string, password: string): Promise<LDAPUser | null> {
    const client = this.createClient();

    return new Promise((resolve, reject) => {
      // First bind with service account
      client.bind(this.config.bindDN, this.config.bindPassword, async (bindErr) => {
        if (bindErr) {
          client.unbind();
          reject(new Error(`LDAP bind failed: ${bindErr.message}`));
          return;
        }

        // Search for user
        try {
          const users = await this.searchUser(client, username);

          if (users.length === 0) {
            client.unbind();
            resolve(null);
            return;
          }

          // Verify password by binding as the user
          const user = users[0];
          client.unbind();

          // Reconnect and verify password
          const verifyClient = this.createClient();
          verifyClient.bind(user.dn, password, (verifyErr) => {
            verifyClient.unbind();
            if (verifyErr) {
              if (verifyErr.name === 'InvalidCredentialsError') {
                resolve(null);
              } else {
                reject(verifyErr);
              }
            } else {
              resolve(user);
            }
          });
        } catch (searchErr) {
          client.unbind();
          reject(searchErr);
        }
      });
    });
  }

  /**
   * Construct user DN from username
   */
  private constructUserDn(username: string): string {
    // Replace {{username}} placeholder in search filter
    const filter = this.config.searchFilter.replace('{{username}}', username);

    // For simple bind, construct DN directly
    if (this.config.usernameAttribute) {
      return `${this.config.usernameAttribute}=${username},${this.config.searchBase}`;
    }

    return username;
  }

  /**
   * Search for user in LDAP directory
   */
  private searchUser(client: Client, username: string): Promise<LDAPUser[]> {
    return new Promise((resolve, reject) => {
      const filter = this.config.searchFilter.replace('{{username}}', username);

      const opts: SearchOptions = {
        filter,
        scope: 'sub',
        attributes: [
          'dn',
          this.config.usernameAttribute || 'uid',
          this.config.emailAttribute || 'mail',
          this.config.displayNameAttribute || 'cn',
          this.config.groupAttribute || 'memberOf',
          'givenName',
          'sn',
          'department',
          'title',
        ],
      };

      const entries: LDAPUser[] = [];

      client.search(this.config.searchBase, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        res.on('searchEntry', (entry) => {
          const attrs = entry.ppiAttributes || entry.attributes;

          const getAttr = (name: string): string | undefined => {
            const attr = attrs.find((a: { type: string }) => a.type === name);
            return attr?.values?.[0] || attr?.ppiValues?.[0];
          };

          const getAttrArray = (name: string): string[] => {
            const attr = attrs.find((a: { type: string }) => a.type === name);
            return attr?.values || attr?.ppiValues || [];
          };

          const memberOf = getAttrArray(this.config.groupAttribute || 'memberOf');

          entries.push({
            dn: entry.dn.toString(),
            uid: getAttr(this.config.usernameAttribute || 'uid') || username,
            email: (getAttr(this.config.emailAttribute || 'mail') || '').toLowerCase(),
            displayName: getAttr(this.config.displayNameAttribute || 'cn') || username,
            firstName: getAttr('givenName'),
            lastName: getAttr('sn'),
            department: getAttr('department'),
            jobTitle: getAttr('title'),
            groups: memberOf.map((g: string) => this.extractGroupName(g)),
            memberOf,
          });
        });

        res.on('error', (searchErr) => {
          reject(searchErr);
        });

        res.on('end', () => {
          resolve(entries);
        });
      });
    });
  }

  /**
   * Get user by DN
   */
  private getUserByDn(client: Client, dn: string): Promise<LDAPUser> {
    return new Promise((resolve, reject) => {
      const opts: SearchOptions = {
        scope: 'base',
        attributes: [
          this.config.usernameAttribute || 'uid',
          this.config.emailAttribute || 'mail',
          this.config.displayNameAttribute || 'cn',
          this.config.groupAttribute || 'memberOf',
          'givenName',
          'sn',
          'department',
          'title',
        ],
      };

      client.search(dn, opts, (err, res) => {
        if (err) {
          reject(err);
          return;
        }

        let entry: LDAPUser | null = null;

        res.on('searchEntry', (e) => {
          const attrs = e.ppiAttributes || e.attributes;

          const getAttr = (name: string): string | undefined => {
            const attr = attrs.find((a: { type: string }) => a.type === name);
            return attr?.values?.[0] || attr?.ppiValues?.[0];
          };

          const getAttrArray = (name: string): string[] => {
            const attr = attrs.find((a: { type: string }) => a.type === name);
            return attr?.values || attr?.ppiValues || [];
          };

          const memberOf = getAttrArray(this.config.groupAttribute || 'memberOf');

          entry = {
            dn: e.dn.toString(),
            uid: getAttr(this.config.usernameAttribute || 'uid') || '',
            email: (getAttr(this.config.emailAttribute || 'mail') || '').toLowerCase(),
            displayName: getAttr(this.config.displayNameAttribute || 'cn') || '',
            firstName: getAttr('givenName'),
            lastName: getAttr('sn'),
            department: getAttr('department'),
            jobTitle: getAttr('title'),
            groups: memberOf.map((g: string) => this.extractGroupName(g)),
            memberOf,
          };
        });

        res.on('error', (searchErr) => {
          reject(searchErr);
        });

        res.on('end', () => {
          if (entry) {
            resolve(entry);
          } else {
            reject(new Error('User not found'));
          }
        });
      });
    });
  }

  /**
   * Extract group name from DN
   */
  private extractGroupName(dn: string): string {
    const match = dn.match(/cn=([^,]+)/i);
    return match ? match[1] : dn;
  }

  /**
   * Get all groups
   */
  async getGroups(): Promise<LDAPGroup[]> {
    const client = this.createClient();

    return new Promise((resolve, reject) => {
      client.bind(this.config.bindDN, this.config.bindPassword, (bindErr) => {
        if (bindErr) {
          client.unbind();
          reject(new Error(`LDAP bind failed: ${bindErr.message}`));
          return;
        }

        const opts: SearchOptions = {
          filter: '(objectClass=groupOfNames)',
          scope: 'sub',
          attributes: ['dn', 'cn', 'description', 'member'],
        };

        const groups: LDAPGroup[] = [];

        client.search(
          this.config.groupSearchBase || this.config.searchBase,
          opts,
          (err, res) => {
            if (err) {
              client.unbind();
              reject(err);
              return;
            }

            res.on('searchEntry', (entry) => {
              const attrs = entry.ppiAttributes || entry.attributes;

              const getAttr = (name: string): string | undefined => {
                const attr = attrs.find((a: { type: string }) => a.type === name);
                return attr?.values?.[0] || attr?.ppiValues?.[0];
              };

              const getAttrArray = (name: string): string[] => {
                const attr = attrs.find((a: { type: string }) => a.type === name);
                return attr?.values || attr?.ppiValues || [];
              };

              groups.push({
                dn: entry.dn.toString(),
                name: getAttr('cn') || '',
                description: getAttr('description'),
                members: getAttrArray('member'),
              });
            });

            res.on('error', (searchErr) => {
              client.unbind();
              reject(searchErr);
            });

            res.on('end', () => {
              client.unbind();
              resolve(groups);
            });
          }
        );
      });
    });
  }

  /**
   * Create user from LDAP entry
   */
  static createUserFromLdapEntry(
    entry: LDAPUser,
    companyId: string
  ): {
    externalId: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    jobTitle?: string;
    groups: string[];
  } {
    return {
      externalId: entry.uid,
      email: entry.email,
      displayName: entry.displayName,
      firstName: entry.firstName,
      lastName: entry.lastName,
      department: entry.department,
      jobTitle: entry.jobTitle,
      groups: entry.groups,
    };
  }
}
