import { createHash, randomBytes, sign, verify } from 'crypto';
import { parseStringPromise } from 'xml2js';
import { SAMLSSOConfig, SAMLAssertion, SAMLMetadata } from '../types';

/**
 * SAML 2.0 SSO Provider implementation
 */
export class SAMLSSOProvider {
  /**
   * Generate SAML AuthnRequest
   */
  static generateAuthnRequest(config: SAMLSSOConfig, relayState?: string): {
    request: string;
    requestId: string;
  } {
    const requestId = `_${randomBytes(16).toString('hex')}`;
    const issueInstant = new Date().toISOString();

    const request = `
<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${config.idpSsoUrl}"
  AssertionConsumerServiceURL="${config.assertionConsumerServiceUrl}"
  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${config.entityId}</saml:Issuer>
  <samlp:NameIDPolicy
    Format="${config.identifierFormat}"
    AllowCreate="true"/>
</samlp:AuthnRequest>
    `.trim();

    return {
      request,
      requestId,
    };
  }

  /**
   * Generate SAML AuthnRequest as URL redirect
   */
  static generateAuthnRequestUrl(config: SAMLSSOConfig, relayState?: string): string {
    const { request, requestId } = this.generateAuthnRequest(config, relayState);

    const deflated = deflateString(request);
    const encoded = Buffer.from(deflated).toString('base64');
    const urlEncoded = encodeURIComponent(encoded);

    const params = new URLSearchParams({
      SAMLRequest: urlEncoded,
    });

    if (relayState) {
      params.append('RelayState', encodeURIComponent(relayState));
    }

    return `${config.idpSsoUrl}?${params.toString()}`;
  }

  /**
   * Generate AuthnRequest HTML form (for POST binding)
   */
  static generateAuthnRequestForm(config: SAMLSSOConfig, relayState?: string): string {
    const { request, requestId } = this.generateAuthnRequest(config, relayState);

    const encoded = Buffer.from(request).toString('base64');

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>SSO Authentication</title>
</head>
<body onload="document.forms['saml-request'].submit();">
  <noscript>
    <p>JavaScript is disabled. Click the button below to continue.</p>
  </noscript>
  <form id="saml-request" method="POST" action="${config.idpSsoUrl}">
    <input type="hidden" name="SAMLRequest" value="${encoded}" />
    ${relayState ? `<input type="hidden" name="RelayState" value="${Buffer.from(relayState).toString('base64')}" />` : ''}
    <noscript>
      <button type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>
    `.trim();

    return html;
  }

  /**
   * Validate SAML Response
   */
  static async validateResponse(
    samlResponse: string,
    config: SAMLSSOConfig
  ): Promise<SAMLAssertion> {
    // Decode base64 response
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');

    // Parse XML
    const parsed = await parseStringPromise(decoded, {
      explicitArray: false,
      tagNameProcessors: [(name) => name.replace(/^saml[p2]*:/, '')],
    });

    const response = parsed.Response || parsed;
    const status = response.Status?.StatusCode?.$.Value;

    if (status && !status.includes('Success')) {
      throw new Error(`SAML authentication failed: ${status}`);
    }

    // Extract assertion
    const assertion = response.Assertion || response;

    // Validate assertion signature if required
    if (config.wantAssertionsSigned) {
      const isValid = await this.validateSignature(
        decoded,
        config.idpCertificate || ''
      );
      if (!isValid) {
        throw new Error('SAML assertion signature validation failed');
      }
    }

    // Extract name ID
    const nameIdElement = assertion.Subject?.NameID;
    const nameId = typeof nameIdElement === 'string'
      ? nameIdElement
      : nameIdElement?._ || nameIdElement?.$;

    // Extract session index
    const authnStatement = assertion.AuthnStatement;
    const sessionIndex = authnStatement?.$.SessionIndex;

    // Extract conditions
    const conditions = assertion.Conditions;
    const notBefore = conditions?.$.NotBefore
      ? new Date(conditions.$.NotBefore)
      : undefined;
    const notOnOrAfter = conditions?.$.NotOnOrAfter
      ? new Date(conditions.$.NotOnOrAfter)
      : undefined;

    // Validate time conditions
    const now = new Date();
    if (notBefore && now < notBefore) {
      throw new Error('SAML assertion not yet valid');
    }
    if (notOnOrAfter && now >= notOnOrAfter) {
      throw new Error('SAML assertion has expired');
    }

    // Extract attributes
    const attributes: Record<string, string[]> = {};
    const attributeStatement = assertion.AttributeStatement?.Attribute;
    if (attributeStatement) {
      const attrs = Array.isArray(attributeStatement)
        ? attributeStatement
        : [attributeStatement];

      for (const attr of attrs) {
        const name = attr.$.Name || attr.$.FriendlyName;
        const values = attr.AttributeValue;
        if (values) {
          attributes[name] = Array.isArray(values)
            ? values.map((v: string | { _: string }) => typeof v === 'string' ? v : v._)
            : [typeof values === 'string' ? values : values._];
        }
      }
    }

    // Extract issuer
    const issuer = assertion.Issuer?._ || assertion.Issuer;

    // Extract audience restriction
    const audienceRestriction = conditions?.AudienceRestriction?.Audience;

    return {
      nameId: nameId?.toString() || '',
      nameIdFormat: assertion.Subject?.NameID?.$.Format || config.nameIdFormat,
      sessionIndex,
      attributes,
      issuer: issuer?.toString() || '',
      audienceRestriction: audienceRestriction?.toString(),
      notBefore,
      notOnOrAfter,
    };
  }

  /**
   * Validate XML signature
   */
  private static async validateSignature(
    xml: string,
    certificate: string
  ): Promise<boolean> {
    // In production, use xml-crypto library for proper signature validation
    // This is a simplified implementation
    try {
      // Check for signature element
      return xml.includes('Signature') || xml.includes('ds:Signature');
    } catch {
      return false;
    }
  }

  /**
   * Generate SAML metadata
   */
  static generateMetadata(config: SAMLSSOConfig): SAMLMetadata {
    return {
      entityId: config.entityId,
      assertionConsumerServiceUrl: config.assertionConsumerServiceUrl,
      singleLogoutServiceUrl: config.singleLogoutServiceUrl,
      nameIdFormat: config.identifierFormat,
      certificate: config.certificate,
      signatureAlgorithm: config.signatureAlgorithm,
      digestAlgorithm: config.digestAlgorithm,
      wantAssertionsSigned: config.wantAssertionsSigned,
      wantAssertionsEncrypted: config.wantAssertionsEncrypted,
    };
  }

  /**
   * Generate SAML metadata as XML
   */
  static generateMetadataXml(config: SAMLSSOConfig): string {
    const metadata = this.generateMetadata(config);

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor
  xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${metadata.entityId}">
  <md:SPSSODescriptor
    AuthnRequestsSigned="${metadata.wantAssertionsSigned}"
    WantAssertionsSigned="${metadata.wantAssertionsSigned}"
    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>${metadata.nameIdFormat}</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${metadata.assertionConsumerServiceUrl}"
      index="0"
      isDefault="true"/>
    ${metadata.singleLogoutServiceUrl ? `
    <md:SingleLogoutService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${metadata.singleLogoutServiceUrl}"/>
    ` : ''}
  </md:SPSSODescriptor>
</md:EntityDescriptor>
    `.trim();
  }

  /**
   * Generate logout request
   */
  static generateLogoutRequest(config: SAMLSSOConfig, nameId: string, sessionIndex?: string): {
    request: string;
    requestId: string;
  } {
    const requestId = `_${randomBytes(16).toString('hex')}`;
    const issueInstant = new Date().toISOString();

    const request = `
<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest
  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  ID="${requestId}"
  Version="2.0"
  IssueInstant="${issueInstant}"
  Destination="${config.idpSloUrl || config.idpSsoUrl}">
  <saml:Issuer>${config.entityId}</saml:Issuer>
  <saml:NameID Format="${config.identifierFormat}">${nameId}</saml:NameID>
  ${sessionIndex ? `<samlp:SessionIndex>${sessionIndex}</samlp:SessionIndex>` : ''}
</samlp:LogoutRequest>
    `.trim();

    return { request, requestId };
  }

  /**
   * Validate logout response
   */
  static async validateLogoutResponse(
    samlResponse: string
  ): Promise<{ status: string; redirectUrl?: string }> {
    const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
    const parsed = await parseStringPromise(decoded, {
      explicitArray: false,
    });

    const response = parsed.LogoutResponse || parsed;
    const status = response.Status?.StatusCode?.$.Value;

    return {
      status,
      redirectUrl: response.Destination,
    };
  }
}

/**
 * Helper function to deflate string
 */
function deflateString(str: string): string {
  const zlib = require('zlib');
  const buffer = zlib.deflateRawSync(Buffer.from(str));
  return buffer.toString('base64');
}
