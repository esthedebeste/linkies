import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const kv = await Deno.openKv()

const API_DOC = `API:
https://l.esthe.live?name=NAME&to=URL

<3`

serve(async request => {
	const url = new URL(request.url)

	if (url.pathname === "/") {
		const name = url.searchParams.get("name")
		const to = url.searchParams.get("to")
		if (!name || !to)
			return new Response(API_DOC, {
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			})

		await kv.set(["urls", name], to)

		return new Response(
			`<!doctype html><html lang="en"><title>created</title>Created <a href=${JSON.stringify(
				`/${encodeURIComponent(name)}`
			)}>${JSON.stringify(name)}</a> => ${JSON.stringify(to)}`,
			{
				status: 201,
				headers: { "Content-Type": "text/html; charset=utf-8" },
			}
		)
	}

	const path = decodeURIComponent(url.pathname.slice(1)) + url.search
	const to = await kv.get<string>(["urls", path])

	if (to.value != null)
		return new Response(`Found! Redirecting to ${to.value}`, {
			status: 307,
			headers: {
				Location: to.value,
				"Content-Type": "text/plain; charset=utf-8",
			},
		})

	return new Response(
		`Couldn't find ${JSON.stringify(path)} :(\n\n${API_DOC}`,
		{
			status: 404,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		}
	)
})
