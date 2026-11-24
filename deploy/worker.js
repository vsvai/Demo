const DEFAULT_RELAY_ORIGIN = 'https://local.sudoyantra.com'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/local/udp') {
      return new Response('Not found', { status: 404 })
    }

    const relayOrigin = env.RELAY_ORIGIN || DEFAULT_RELAY_ORIGIN
    const target = new URL('/local/udp', relayOrigin)
    target.search = url.search

    const headers = new Headers()
    if (env.RELAY_TOKEN) headers.set('x-relay-token', env.RELAY_TOKEN)

    const init = { method: request.method, headers, redirect: 'manual' }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = await request.arrayBuffer()
    }

    const upstream = await fetch(target.toString(), init)
    const response = new Response(upstream.body, upstream)
    response.headers.set('Cache-Control', 'no-store')
    return response
  },
}
