/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  type AxiosInstance,
  type AxiosInterceptorManager,
  type AxiosRequestConfig,
  type AxiosResponse,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'
import { defer, map } from 'rxjs'
import { fromPromise } from 'rxjs/internal/observable/innerFrom'

export default class AxiosObservable {
  private requestInterceptors: Map<string, number> = new Map()
  private responseInterceptors: Map<string, number> = new Map()

  private axiosInstance: AxiosInstance
  constructor(config?: CreateAxiosDefaults) {
    this.axiosInstance = axios.create(config)
  }

  getRequestInterceptors() {
    return this.requestInterceptors.entries()
  }

  addRequestInterceptor(
    key: string,
    ...handler: Parameters<AxiosInterceptorManager<InternalAxiosRequestConfig>['use']>
  ) {
    this.removeRequestInterceptor(key)
    this.requestInterceptors.set(key, this.axiosInstance.interceptors.request.use(...handler))
  }

  removeRequestInterceptor(key: string) {
    const findSameInterceptorKey = this.requestInterceptors.get(key)
    if (findSameInterceptorKey) {
      this.axiosInstance.interceptors.request.eject(findSameInterceptorKey)
    }
  }

  getResponseInterceptors() {
    return this.responseInterceptors.entries()
  }

  addResponseInterceptor(key: string, ...handler: Parameters<AxiosInterceptorManager<AxiosResponse>['use']>) {
    this.removeResponseInterceptor(key)
    this.responseInterceptors.set(key, this.axiosInstance.interceptors.response.use(...handler))
  }

  removeResponseInterceptor(key: string) {
    const findSameInterceptorKey = this.responseInterceptors.get(key)
    if (findSameInterceptorKey) {
      this.axiosInstance.interceptors.response.eject(findSameInterceptorKey)
    }
  }

  get<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.get<T, AxiosResponse<T>, D>(url, config)).pipe(map((r) => r.data)),
    )
  }

  post<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.post<T, AxiosResponse<T>, D>(url, data, config)).pipe(map((r) => r.data)),
    )
  }

  postForm<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.postForm<T, AxiosResponse<T>, D>(url, data, config)).pipe(map((r) => r.data)),
    )
  }

  delete<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.delete<T, AxiosResponse<T>, D>(url, config)).pipe(map((r) => r.data)),
    )
  }

  head<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.head<T, AxiosResponse<T>, D>(url, config)).pipe(map((r) => r.data)),
    )
  }

  options<T = any, D = any>(url: string, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.options<T, AxiosResponse<T>, D>(url, config)).pipe(map((r) => r.data)),
    )
  }

  put<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.put<T, AxiosResponse<T>, D>(url, data, config)).pipe(map((r) => r.data)),
    )
  }

  patch<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.patch<T, AxiosResponse<T>, D>(url, data, config)).pipe(map((r) => r.data)),
    )
  }

  putForm<T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>) {
    return defer(() =>
      fromPromise(this.axiosInstance.putForm<T, AxiosResponse<T>, D>(url, data, config)).pipe(map((r) => r.data)),
    )
  }
}
