export default class HttpService {
  protected baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: Omit<RequestInit, 'body'> & { body?: unknown; timeout?: number } = {},
  ): Promise<T> {
    const { timeout = 15000, body, headers, ...restOptions } = options
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const requestHeaders = new Headers(headers)
    if (body && !(body instanceof FormData)) {
      requestHeaders.set('Content-Type', 'application/json')
    }

    // Dynamic JWT Token injection
    const token = localStorage.getItem('auth_token')
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }

    // Check for backoffice admin override in localStorage
    const originalEmployee = localStorage.getItem('originalEmployee')
    if (originalEmployee) {
      requestHeaders.set('X-Admin-Override', originalEmployee)
    }

    const config: RequestInit = {
      ...restOptions,
      headers: requestHeaders,
      signal: controller.signal,
    }

    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body)
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, config)
      clearTimeout(timeoutId)

      // Catch session expiration or bad credentials
      if (response.status === 401) {
        localStorage.removeItem('auth_token')
        throw new Error('Unauthorized')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      return text ? JSON.parse(text) : ({} as T)
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`)
      }
      throw err
    }
  }

  public async get<T>(
    path: string,
    options?: Omit<RequestInit, 'method' | 'body'> & { body?: unknown; timeout?: number },
  ): Promise<T> {
    let queryPath = path
    if (options?.body && typeof options.body === 'object') {
      const params = new URLSearchParams()
      Object.entries(options.body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
      const queryString = params.toString()
      if (queryString) {
        queryPath += (path.includes('?') ? '&' : '?') + queryString
      }
      const restOptions = { ...options }
      delete restOptions.body
      return this.request<T>(queryPath, { ...restOptions, method: 'GET' })
    }
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  public async post<T>(
    path: string,
    options?: Omit<RequestInit, 'method' | 'body'> & { body?: unknown; timeout?: number },
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST' })
  }

  public async put<T>(
    path: string,
    options?: Omit<RequestInit, 'method' | 'body'> & { body?: unknown; timeout?: number },
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT' })
  }

  public async patch<T>(
    path: string,
    options?: Omit<RequestInit, 'method' | 'body'> & { body?: unknown; timeout?: number },
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH' })
  }

  public async delete<T>(
    path: string,
    options?: Omit<RequestInit, 'method' | 'body'> & { body?: unknown; timeout?: number },
  ): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}
