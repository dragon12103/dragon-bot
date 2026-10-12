const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
let botOff = {}

async function start() {
const { state, saveCreds } = await useMultiFileAuthState('auth')
const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), printQRInTerminal: true })
sock.ev.on('creds.update', saveCreds)
sock.ev.on('connection.update', u => { if(u.connection==='open') console.log('Dragon Online 🐉') })

// دي الفنكشن اللي هتخلي اي رد بالصورة الحمرا
async function dragonReply(jid, text, extra={}){
try{
if(fs.existsSync('./photo-output.jpeg')){
await sock.sendMessage(jid,{image:fs.readFileSync('./photo-output.jpeg'),caption:text,...extra})
}else{
await sock.sendMessage(jid,{text:text,...extra})
}
}catch(e){ await sock.sendMessage(jid,{text:text,...extra}) }
}

sock.ev.on('messages.upsert', async ({ messages }) => {
const m = messages[0]; if(!m.message || m.key.fromMe) return
const rawText = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").trim()
const text = rawText.toLowerCase()
const from = m.key.remoteJid; const sender = m.key.participant || from
const isGroup = from.endsWith('@g.us')
const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid
const mentionedOne = mentioned?.[0]
const owner = "201159299899"; const isOwner = sender.includes(owner)

if(botOff[from] &&!isOwner &&!['.بوت فتح','.فتح البوت'].includes(text) && isGroup) return

let isAdmin = false; try { if(isGroup){ const meta = await sock.groupMetadata(from); const p = meta.participants.find(x=>x.id===sender); isAdmin = p?.admin } } catch {}
const badWords = ['كسملك','نيك','قحبة','عرض','خول','شرموط','متناك']
const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com)/
if(isGroup &&!isAdmin &&!isOwner && (badWords.some(w=>text.includes(w)) || linkRegex.test(text))){
 try { const meta = await sock.groupMetadata(from); const botAdmin = meta.participants.find(x=>x.id.includes(sock.user.id.split(':')[0]))?.admin; if(botAdmin){ await dragonReply(from,`تم حذف رسالة مخالفة من @${sender.split('@')[0]}`,{mentions:[sender]}); await sock.sendMessage(from,{ delete: m.key }) } } catch {}
 return
}

if([".اوامر","اوامر","الاوامر"].includes(text)){
const menu = `*👑 الاسم: ɪ'ᴍᴅʀᴀɢᴏɴ👨🏻‍💻🫸🏻 🐉*

*👨🏻‍💻 رقم المطور: 01159299899*

🫷🏻 *الاوامر* 🫸🏻
.طرد
.رفع
.منشن
.تغير صوره البار
.تغير اسم البار
.تغير بايو البار
.قفل الشات
.فتح الشات
.اغاني
.العاب
.نكت

___________________________________
*اتمنى لكم فرصه سعيده👨🏻‍💻🥹*`
await dragonReply(from,menu)
return
}

if(rawText.startsWith('.طرد')){ if(!mentionedOne){ await dragonReply(from,"منشن اللي عايز تطرده 🥶",{quoted:m}); return } await sock.groupParticipantsUpdate(from, [mentionedOne], "remove"); await dragonReply(from,`تم الطرد ✅`); return }
if(rawText.startsWith('.رفع')){ if(!mentionedOne){ await dragonReply(from,"منشن اللي عايز ترفعه 👑",{quoted:m}); return } await sock.groupParticipantsUpdate(from, [mentionedOne], "promote"); await dragonReply(from,`اترفع @${mentionedOne.split('@')[0]} 👑`,{mentions:[mentionedOne]}); return }
if(text==='.منشن'){ const meta = await sock.groupMetadata(from); const all = meta.participants.map(p=>p.id); await dragonReply(from,"منشن للكل 👨🏻‍💻🫸🏻\n"+all.map(a=>`@${a.split('@')[0]}`).join(' '),{mentions:all}); return }
if(text.startsWith('.تغير صوره البار')){ const q = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || m.message.imageMessage; if(!q){ await dragonReply(from,"اعمل ريبلاي على صورة",{quoted:m}); return } const {downloadContentFromMessage}=require('@whiskeysockets/baileys'); const stream = await downloadContentFromMessage(q,'image'); let buff=Buffer.from([]); for await(const c of stream) buff=Buffer.concat([buff,c]); await sock.updateProfilePicture(from,buff); await dragonReply(from,"اتغيرت ✅"); return }
if(rawText.startsWith('.تغير اسم البار')){ const name = rawText.replace('.تغير اسم البار','').trim(); if(!name) return; await sock.groupUpdateSubject(from,name); await dragonReply(from,"الاسم اتغير ✅"); return }
if(rawText.startsWith('.تغير بايو البار')){ const bio = rawText.replace('.تغير بايو البار','').trim(); if(!bio) return; await sock.groupUpdateDescription(from,bio); await dragonReply(from,"البايو اتغير ✅"); return }
if(text==='.قفل الشات'){ await sock.groupSettingUpdate(from,'announcement'); await dragonReply(from,"اتقفل 🔒"); return }
if(text==='.فتح الشات'){ await sock.groupSettingUpdate(from,'not_announcement'); await dragonReply(from,"اتفتح 🔓"); return }
if(text==='.اغاني'){ await dragonReply(from,"🎵 ابعت.play + اسم الاغنية"); return }
if(text==='.نكت'){ const jokes=["مرة واحد نام متأخر صحي لقى الحلم خلص 😂","مرة محشش سألوه ايه الفرق بين الاسبوع والصحراء قال الاسبوع فيه حد 😂"]; await dragonReply(from,jokes[Math.floor(Math.random()*jokes.length)]); return }
if(text==='.العاب'){ await dragonReply(from,"🎮 الالعاب قريباً"); return }

// امر التحية بتاعتك
if(text==='.تحيه'){ await dragonReply(from,`👋 اهلا بيك يا وحش نورت الجروب 😈🔥\n\n👑 الاسم: ɪ'ᴍᴅʀᴀɢᴏɴ👨🏻‍💻🫸🏻 🐉\n👨🏻‍💻 المطور: 01159299899`); return }

})
}
start()
