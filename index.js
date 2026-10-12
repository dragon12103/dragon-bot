const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')

let botOff = {}

async function start() {
const { state, saveCreds } = await useMultiFileAuthState('auth')
const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), printQRInTerminal: true })
sock.ev.on('creds.update', saveCreds)
sock.ev.on('connection.update', u => { if(u.connection==='open') console.log('Dragon Online 🐉') })

sock.ev.on('messages.upsert', async ({ messages }) => {
const m = messages[0]; if(!m.message || m.key.fromMe) return
const rawText = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").trim()
const text = rawText.toLowerCase()
const from = m.key.remoteJid; const sender = m.key.participant || from
const isGroup = from.endsWith('@g.us')
const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid
const mentionedOne = mentioned?.[0]
const owner = "201159299899"; const isOwner = sender.includes(owner)

// بوت قفل / فتح
if(botOff[from] &&!isOwner &&!['.بوت فتح','.فتح البوت'].includes(text) && isGroup) return

// فلتر شتايم ولينكات
let isAdmin = false; try { if(isGroup){ const meta = await sock.groupMetadata(from); const p = meta.participants.find(x=>x.id===sender); isAdmin = p?.admin } } catch {}
const badWords = ['كسملك','نيك','قحبة','عرض','خول','شرموط','متناك']
const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com)/
if(isGroup &&!isAdmin &&!isOwner && (badWords.some(w=>text.includes(w)) || linkRegex.test(text))){
 try { const meta = await sock.groupMetadata(from); const botAdmin = meta.participants.find(x=>x.id.includes(sock.user.id.split(':')[0]))?.admin; if(botAdmin){ await sock.sendMessage(from,{text:`تم حذف رسالة مخالفة من @${sender.split('@')[0]}`, mentions:[sender]}); await sock.sendMessage(from,{ delete: m.key }) } } catch {}
 return
}

//.اوامر - نفس القايمة اللي انت بعتها
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
 if(fs.existsSync('./photo-output.jpeg')){
await sock.sendMessage(from,{image:fs.readFileSync('./photo-output.jpeg'),caption:menu})
return
}

//.طرد
if(rawText.startsWith('.طرد')){ if(!mentionedOne){ await sock.sendMessage(from,{text:"منشن اللي عايز تطرده 🥶"},{quoted:m}); return } await sock.groupParticipantsUpdate(from, [mentionedOne], "remove"); return }
//.رفع
if(rawText.startsWith('.رفع')){ if(!mentionedOne){ await sock.sendMessage(from,{text:"منشن اللي عايز ترفعه 👑"},{quoted:m}); return } await sock.groupParticipantsUpdate(from, [mentionedOne], "promote"); await sock.sendMessage(from,{text:`اترفع @${mentionedOne.split('@')[0]} 👑`, mentions:[mentionedOne]}); return }
//.منشن
if(text==='.منشن'){ const meta = await sock.groupMetadata(from); const all = meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:"منشن للكل 👨🏻‍💻🫸🏻\n"+all.map(a=>`@${a.split('@')[0]}`).join(' '), mentions:all}); return }
//.تغير صوره البار
if(text.startsWith('.تغير صوره البار')){ const q = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage || m.message.imageMessage; if(!q){ await sock.sendMessage(from,{text:"اعمل ريبلاي على صورة"},{quoted:m}); return } const {downloadContentFromMessage}=require('@whiskeysockets/baileys'); const stream = await downloadContentFromMessage(q,'image'); let buff=Buffer.from([]); for await(const c of stream) buff=Buffer.concat([buff,c]); await sock.updateProfilePicture(from,buff); await sock.sendMessage(from,{text:"اتغيرت ✅"}); return }
//.تغير اسم البار
if(rawText.startsWith('.تغير اسم البار')){ const name = rawText.replace('.تغير اسم البار','').trim(); if(!name) return; await sock.groupUpdateSubject(from,name); return }
//.تغير بايو البار
if(rawText.startsWith('.تغير بايو البار')){ const bio = rawText.replace('.تغير بايو البار','').trim(); if(!bio) return; await sock.groupUpdateDescription(from,bio); return }
//.قفل الشات
if(text==='.قفل الشات'){ await sock.groupSettingUpdate(from,'announcement'); await sock.sendMessage(from,{text:"اتقفل 🔒"}); return }
//.فتح الشات
if(text==='.فتح الشات'){ await sock.groupSettingUpdate(from,'not_announcement'); await sock.sendMessage(from,{text:"اتفتح 🔓"}); return }
//.اغاني
if(text==='.اغاني'){ await sock.sendMessage(from,{text:"🎵 ابعت.play + اسم الاغنية"}); return }
//.العاب /.نكت
if(text==='.نكت'){ const jokes=["مرة واحد نام متأخر صحي لقى الحلم خلص 😂","مرة محشش سألوه ايه الفرق بين الاسبوع والصحراء قال الاسبوع فيه حد 😂"]; await sock.sendMessage(from,{text:jokes[Math.floor(Math.random()*jokes.length)]}); return }
if(text==='.العاب'){ await sock.sendMessage(from,{text:"🎮 الالعاب قريباً"}); return }
})
}
start()
