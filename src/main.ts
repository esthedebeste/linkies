import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const kv = await Deno.openKv()

const API_DOC = `API:
https://l.esthe.live?name=NAME&to=URL
    NAME: the name of the short URL
    URL: the URL to redirect to

Example:
https://l.esthe.live?name=home&to=https://esthe.live/
    => https://l.esthe.live/home => https://esthe.live/


Made with hearts and rainbows! <3`

const powered = [
	"spinning hamster wheels",
	"me typing really fast & trying to keep up",
	"if a billion monkeys typed on a billion typewriters",
	"the power of friendship",
	"silliness",
	"!!!MASSIVE CAT!!!",
	"ancient egyptian scrolls",
	"the age old curse of the mummy",
]

serve(async request => {
	const url = new URL(request.url)

	if (url.pathname === "/") {
		const name = url.searchParams.get("name")
		const to = url.searchParams.get("to")
		if (!name || !to)
			return new Response(API_DOC, {
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"X-Powered-By": powered[Math.floor(Math.random() * powered.length)],
				},
			})

		await kv.set(["urls", name], to)

		return new Response(
			`<!doctype html><html lang=en><title>created</title>Created <a href=${JSON.stringify(
				`/${encodeURIComponent(name)}`
			)}>${JSON.stringify(name)}</a> => ${JSON.stringify(to)}`,
			{
				status: 201,
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"X-Powered-By": powered[Math.floor(Math.random() * powered.length)],
				},
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
				"X-Powered-By": powered[Math.floor(Math.random() * powered.length)],
			},
		})

	return new Response(
		`Couldn't find ${JSON.stringify(path)} :(\n\n${API_DOC}`,
		{
			status: 404,
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"X-Powered-By": powered[Math.floor(Math.random() * powered.length)],
			},
		}
	)
})
