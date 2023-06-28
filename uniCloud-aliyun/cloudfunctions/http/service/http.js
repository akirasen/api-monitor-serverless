const { Service } = require("uni-cloud-router");
const CryptoJS = require('crypto-js'); 
const db = uniCloud.database();
module.exports = class httpService extends Service {	
	async monitor(ctx) {
		const mode = parseInt(ctx.event.queryStringParameters.mode)
		if(mode == 888888888){
			//新建用户 https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=888888888
			let username = ""
			let psw = ""
			if(!ctx.event.queryStringParameters.user||!ctx.event.queryStringParameters.psw){
				return "请输入账号user密码psw"
			}
			else{
				username = ctx.event.queryStringParameters.user
				psw =  CryptoJS.SHA1(ctx.event.queryStringParameters.psw).toString()
				let tag = ""
				let app = ""
				let details = {}
				if(ctx.event.queryStringParameters.tag){
					tag = ctx.event.queryStringParameters.tag
				}
				if(ctx.event.queryStringParameters.app){
					app = ctx.event.queryStringParameters.app
				}
				if(ctx.event.queryStringParameters.details){
					details = decodeURIComponent(ctx.event.queryStringParameters.details)
				}
				const result = await db.collection('admins').add({
					username,psw,app,tag,details
				})
				return {reason:"新建账号成功",result}
			}
		}
		else if(mode == 2){
			//新建任务 https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=2&exp=200&method=GET&notify=18519888855&api=https%3A%2F%2Fapis.yourdomain.cn%2Fv2%2Fapi%2Fgetlistwithphone%3Fpageindex%3D1%26pagesize%3D1
			if(!ctx.event.queryStringParameters.user||!ctx.event.queryStringParameters.psw||!ctx.event.queryStringParameters.method||!ctx.event.queryStringParameters.notify||!ctx.event.queryStringParameters.exp||!ctx.event.queryStringParameters.api){
				return "请输入账号user密码psw报错网址api(UrlEncode)期望状态码exp提醒手机号notify请求方法method"
			}
			else{
				const pswCheck = await db.collection('admins').where({username: ctx.event.queryStringParameters.user}).get()
				if(pswCheck.data.length == 0){
					return "账号user不匹配"
				}
				else{
					if(pswCheck.data[0].psw == CryptoJS.SHA1(ctx.event.queryStringParameters.psw).toString()){
						const jobCheck = await db.collection('monitor-job').where({api:decodeURIComponent(ctx.event.queryStringParameters.api)}).get()
						if(jobCheck.data.length !== 0){
							return "失败，报错网址api已存在"
						}
						const result = await db.collection('monitor-job').add({
							api:decodeURIComponent(ctx.event.queryStringParameters.api),
							method:ctx.event.queryStringParameters.method,
							expected_to:parseInt(ctx.event.queryStringParameters.exp),
							notify:ctx.event.queryStringParameters.notify,
							owner:pswCheck.data[0]._id,
							state:1,
							count:0,
							create_date:new Date(),
							last_update_date:new Date()
						})
						return {reason:"新建任务成功，请记录任务号id，之后用于禁用任务",result}
					}else{
						return "密码psw不匹配"
					}
				}
			}
		}
		else if(mode == 0 || mode == 1){
			//暂停或启动任务 https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=0&id=649b0464f43e6001c1552c5a
			if(!ctx.event.queryStringParameters.user||!ctx.event.queryStringParameters.psw||!ctx.event.queryStringParameters.id){
				return "请输入账号user密码psw任务id"
			}
			else{
				const pswCheck = await db.collection('admins').where({username: ctx.event.queryStringParameters.user}).get()
				if(pswCheck.data.length == 0){
					return "账号user不匹配"
				}
				else{
					if(pswCheck.data[0].psw == CryptoJS.SHA1(ctx.event.queryStringParameters.psw).toString()){
						const jobCheck = await db.collection('monitor-job').where({_id:ctx.event.queryStringParameters.id}).get()
						if(jobCheck.data.length == 0){
							return "任务id不匹配"
						}
						else{
							if(jobCheck.data[0].state == 0){
								const result = await db.collection('monitor-job').where({_id:jobCheck.data[0]._id}).update({
									state:1,
									last_update_date:new Date()
								})
								return {reason:"状态已改为1：启动",result}
							}else{
								const result = await db.collection('monitor-job').where({_id:jobCheck.data[0]._id}).update({
									state:0,
									last_update_date:new Date()
								})
								return {reason:"状态已改为0：暂停",result} 
							}
						}
					}else{
						return "密码psw不匹配"
					}
				}
			}
		}
		else if(mode == 3){
			//列出任务 https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=3
			if(!ctx.event.queryStringParameters.user||!ctx.event.queryStringParameters.psw){
				return "请输入账号user密码psw"
			}
			else{
				const pswCheck = await db.collection('admins').where({username: ctx.event.queryStringParameters.user}).get()
				if(pswCheck.data.length == 0){
					return "账号user不匹配"
				}
				else{
					if(pswCheck.data[0].psw == CryptoJS.SHA1(ctx.event.queryStringParameters.psw).toString()){
						const jobCheck = await db.collection('monitor-job').where({owner:pswCheck.data[0]._id}).get()
						if(jobCheck.data.length == 0){
							return "失败，无任何任务，请先新建"
						}
						else{
							return {reason:"列出所有任务，state：状态，1启用，0禁用，count：监测到的异常计数",list:jobCheck.data}
						}
						
					}else{
						return "密码psw不匹配"
					}
				}
			}
		}
		else{
			return "请输入密码"
		}
	}
}