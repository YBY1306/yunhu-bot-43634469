/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 *
 */
let token
/**
 *
 */
let ctx_
/**
 *
 */
let chat
let sender
let conversation_id
let conversation_type
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export default {
	async fetch(request, env, ctx) {
		token = env.token
		if (token == null) {
			console.info("env", env)
			console.error("token", token)
			return new Response("词元！次元！吃圆！我要突破次元壁来吃你！", {status: 599});
		}
		ctx_ = ctx

		// You can view your logs in the Observability dashboard
		console.info({message: 'Hello World Worker received a request!'});
		// 1. 只处理 POST
		if (request.method !== "POST") {
			return new Response("Only POST allowed", {status: 405});
		}

		// 2. 解析 JSON
		let data;
		try {
			data = await request.json();
		} catch (err) {
			return new Response("Invalid JSON", {status: 400});
		}

		// 3. 使用数据
		console.log(data);

		const _data_header_eventType = data.header.eventType
		const _data_event_chat = data.event.chat
		const _data_event_sender = data.event.sender
		const _data_event_message = data.event.message
		const _data_event_message_content_instructionName = data.event.message.instructionName
		const _data_event_message_content_commandName = data.event.message.commandName
		const _data_event_message_content_text = data.event.message.content.text

		if (_data_header_eventType != "message.receive.instruction") return new Response("只接受data.header.eventType==message.receive.instruction", {status: 400});

		chat = _data_event_chat
		sender = _data_event_sender
		if (chat.chatType == "bot") {
			conversation_type = "user"
			conversation_id = sender.senderId
		} else if (chat.chatType == "group") {
			conversation_type = "group"
			conversation_id = chat.chatId
		}

		let apiResponse
		switch (_data_event_message_content_commandName) {
			case "鹦鹉":
				apiResponse = await this.echo(_data_event_message_content_text);
				break
			case "获取标签":
				apiResponse = await this.user_relate_in_group(_data_event_message_content_text, true);
				break
			case "获取所有标签":
				apiResponse = await this.user_relate_add_all_in_group(_data_event_message_content_text);
				break
			case "甩掉标签":
				apiResponse = await this.user_relate_in_group(_data_event_message_content_text, true);
				break
			case "甩掉所有标签":
				apiResponse = await this.user_relate_add_all_in_group(_data_event_message_content_text);
				break
			default:
				apiResponse = await this.test_echo_time()
		}


		if (apiResponse != null)
			if (typeof apiResponse === "string") {
				const error_string = apiResponse
				console.error(error_string);
				await this.echo(error_string)
			} else if (apiResponse instanceof Response) {
				const _apiResponse_status = apiResponse.status
				const _apiResponse_statusText = apiResponse.statusText
				console.info(_apiResponse_status + ' ' + _apiResponse_statusText);
				//_apiResponse_text=await apiResponse.text()
				//console.info( _apiResponse_text.toString());
				const _apiResponse_by_json = await apiResponse.json()
				console.info(_apiResponse_by_json);
				//_apiResponse_by_json.code
				//_apiResponse_by_json.msg
				//_apiResponse_by_json.data
				if (_apiResponse_by_json.code != 1) {
					await this.echo(JSON.stringify(_apiResponse_by_json))
				}
			}


		return new Response('Hello World!');

		return new Response(JSON.stringify({
			message: "Received",
			yourData: data,
		}), {
			headers: {
				"Content-Type": "application/json"
			}
		});
		console.info({message: request});

		//return new Response('Hello World!');


	},
	/**
	 * 鹦鹉
	 * @param {*} text
	 * @returns
	 */
	async echo(text) {
		const a = JSON.stringify({
			recvId: conversation_id,
			recvType: conversation_type,
			contentType: "text",
			content: {
				text: text
			}
		});

		const apiResponse = await fetch("https://chat-go.jwzhd.com/open-apis/v1/bot/send?token=" + token, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer xxx",
			},
			body: a,
		});
		return apiResponse
	},
	/**
	 * 发送当前时间，测试是否正常
	 * @param {*} recvId
	 * @param {*} recvType
	 * @returns
	 */
	async test_echo_time() {
		const a = JSON.stringify({
			recvId: conversation_id,
			recvType: conversation_type,
			contentType: "text",
			content: {
				text: new Date().toLocaleString("zh-CN", {timeZone: "Asia/Shanghai"})
			}
		});

		const apiResponse = await fetch("https://chat-go.jwzhd.com/open-apis/v1/bot/send?token=" + token, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer xxx",
			},
			body: a,
		});
		return apiResponse
	},
	/**
	 * 获取标签（只能获取已有的标签，不会自动创建新的标签）
	 * @param {*} tag
	 * @param {*} isadd
	 * @returns
	 */
	async user_relate_in_group(tag, isadd = true) {
		if (conversation_type != "group")
			return "只有群中才有标签"

		const a = JSON.stringify({
			userId: sender.senderId,
			tag: tag,
			groupId: conversation_id,
		});

		const url = isadd ? "https://chat-go.jwzhd.com/open-apis/v1/group/tag/user-relate?token=" + token : "https://chat-go.jwzhd.com/open-apis/v1/group/tag/user-relate-cancel?token=" + token
		const apiResponse = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer xxx",
			},
			body: a,
		});
		return apiResponse
	},
	/**
	 * 获取所有标签，cos被夺舍的蛋黄，震惊牢Feng
	 * @param {*} tag
	 * @param {*} isadd
	 * @returns
	 */
	async user_relate_add_all_in_group(tag, isadd = true) {
		if (conversation_type != "group")
			return "只有群中才有标签"

		const a = JSON.stringify({
			groupId: conversation_id,
		});

		const apiResponse = await fetch("https://chat-go.jwzhd.com/open-apis/v1/group/tag/list?token=" + token, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer xxx",
			},
			body: a,
		});
		console.info("获取标签列表", apiResponse)
		const _apiResponse_status = apiResponse.status
		const _apiResponse_statusText = apiResponse.statusText
		console.info("获取标签列表", _apiResponse_status + ' ' + _apiResponse_statusText);
		//_apiResponse_text=await apiResponse.text()
		//console.info( _apiResponse_text.toString());
		const _apiResponse_by_json = await apiResponse.clone().json()
		console.info("获取标签列表", _apiResponse_by_json);

		if (_apiResponse_by_json.code == 1) {
			_apiResponse_by_json.data.list.forEach((fruit, index) => {
				console.log("获取标签列表", `${index}: ${fruit}`, fruit);
				ctx_.waitUntil(this.user_relate_in_group(fruit.tag, isadd))
			})
		}
		//_apiResponse_by_json.code
		//_apiResponse_by_json.msg
		//_apiResponse_by_json.data
		return apiResponse
	},
};
