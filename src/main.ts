import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const kv = await Deno.openKv()

const API_DOC = "API @ /submit?name=NAME&to=URL\n\n<3"

serve(async request => {
	const url = new URL(request.url)

	if (url.pathname === "/")
		return new Response(API_DOC, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		})

	if (url.pathname === "/submit") {
		const name = url.searchParams.get("name")
		const to = url.searchParams.get("to")
		if (!name || !to)
			return new Response("Missing name or to parameter", { status: 400 })

		kv.set(["urls", name], to)
	}

	const path = request.url.slice(url.origin.length + 1) // https://example.com/abc?a=1 -> abc?a=1 and https://example.com/abc? -> abc?
	const to = await kv.get<string>(["urls", path])

	if (to.value != null)
		return new Response(`Found! Redirecting to ${to.value}`, {
			status: 302,
			headers: {
				Location: to.value,
				"Content-Type": "text/plain; charset=utf-8",
			},
		})

	return new Response("Not found :(\n\n" + API_DOC, {
		status: 404,
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	})
})
