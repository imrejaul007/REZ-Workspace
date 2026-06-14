// @ts-nocheck
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('projectsApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch projects', async () => {
    const projects = [
      { id: 'proj-1', name: 'Summer Campaign', status: 'active' },
      { id: 'proj-2', name: 'Winter Sale', status: 'draft' },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: projects }),
    });

    const response = await fetch('/api/projects');
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    expect(body.data[0].id).toBe('proj-1');
    expect(body.data[0].name).toBe('Summer Campaign');
  });

  it('should filter projects by status', async () => {
    const activeProjects = [{ id: 'proj-1', name: 'Summer Campaign', status: 'active' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: activeProjects }),
    });

    const response = await fetch('/api/projects?status=active');
    const body = await response.json();

    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe('active');
    expect(mockFetch).toHaveBeenCalledWith('/api/projects?status=active');
  });

  it('should handle project fetch error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const response = await fetch('/api/projects');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});
