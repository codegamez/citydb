import { OpenAI } from "openai"
import { type Uploadable } from "openai/uploads"


let openai: OpenAI | null = null

export default () => {

	if (!openai) {
		openai = new OpenAI({
			apiKey: Bun.env.OPENAI_API_KEY
		})
	}

	const chat = async (
		prompts: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
		model: OpenAI.Chat.Completions.ChatCompletionCreateParams["model"] = "gpt-3.5-turbo-16k",
		max_tokens: number = 4000,
		temperature: number = 0,
		response_format?: "text" | "json_object"
	) => {
		try {
			const res = await openai?.chat.completions.create({
				model,
				messages: prompts,
				max_tokens,
				temperature,
				response_format: response_format
					? {
						type: response_format
					}
					: undefined
			})
			return res?.choices[0].message?.content
		} catch (e: any) {
			throw {
				statusCode: 400,
				message: e.response?.data?.error?.message || e.message
			}
		}
	}

	const transcribe = async (file: Uploadable, prompt?: string, language?: string) => {
		try {
			const res = await openai?.audio.transcriptions.create({
				file,
				model: "whisper-1",
				prompt,
				language: language || "en"
			})
			return res?.text
		} catch (e: any) {
			throw {
				statusCode: 400,
				message: e.response?.data?.error?.message || e.message,

			}
		}
	}

	return {
		openai,
		chat,
		transcribe
	}
}
