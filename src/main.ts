import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

/**
 * ```
 * type KV = {
 * 	 urls: {
 *  		[name: string]: Shortlink | string
 *  	}
 *  }
 * ```
 */
const kv = await Deno.openKv()

interface Shortlink {
	url: string
	password?: string
}

async function getShortlink(name: string): Promise<Shortlink | null> {
	const { value: url } = await kv.get<Shortlink | string>(["urls", name])
	if (typeof url === "string") return { url }
	return url
}

async function setShortlink(name: string, url: string, password: string | null): Promise<void> {
	if (password)
		await kv.set(["urls", name], { url, password })
	else 
		await kv.set(["urls", name], url)
}

const API_DOC = `API:
https://l.esthe.live?name=NAME&to=URL
    NAME: the name of the short URL
    URL: the URL to redirect to

Example:
https://l.esthe.live?name=home&to=https://esthe.live/
    => https://l.esthe.live/home => https://esthe.live/


Made with hearts and rainbows! <3`

const DOC_HTML = await Deno.readTextFile(new URL("./doc.html", import.meta.url))

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
		const password = url.searchParams.get("password")
		if (!name || !to)
			return new Response(DOC_HTML, {
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"X-Powered-By": powered[Math.floor(Math.random() * powered.length)],
				},
			})

		const current = await getShortlink(name)
		if(current?.password != null && current.password !== password)
			return new Response(`Forbidden\n\nThe shortlink "${name}" already exists, and you didn't provide the correct password!`, {
				status: 403,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
					"X-Powered-By": powered[Math.floor(Math.random() * powered.length)],
				},
			})
		await setShortlink(name, to, password)

		return new Response(
			`<!doctype html><html lang=en><title>created</title>Created <a href=${JSON.stringify(
				`/${encodeURIComponent(name)}`
			)}>${JSON.stringify(name)}</a> => ${JSON.stringify(to)} with password ${JSON.stringify(password)}`,
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
	const shortlink = await getShortlink(path)

	if (shortlink != null)
		return new Response(`Found! Redirecting to ${shortlink.url}`, {
			status: 307,
			headers: {
				Location: shortlink.url,
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
