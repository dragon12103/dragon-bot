const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys')
const P = require('pino')
const fs = require('fs')
const yts = require('yt-search')
const ytdl = require('@distube/ytdl-core')
let warnings = {}
if (fs.existsSync('./warnings.json')) { try { warnings = JSON.parse(fs.readFileSync('./warnings.json')) } catch {} }
const saveWarnings = () => fs.writeFileSync('./warnings.json', JSON.stringify(warnings))
let botOff = {}
if (fs.existsSync('./botoff.json')) { try { botOff = JSON.parse(fs.readFileSync('./botoff.json')) } catch {} }
const saveBotOff = () => fs.writeFileSync('./botoff.json', JSON.stringify(botOff))
async function DragonBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), browser: ["Dragon-Bot", "Chrome", "2.0"] })
  sock.ev.on('creds.update', saveCreds)
  if (!sock.authState.creds.registered) { await delay(3000); console.log(`👑 كود: ${await sock.requestPairingCode("201159299899")}`) }
  sock.ev.on('connection.update', s => { if (s.connection === 'open') console.log('✅ DRAGON BACK') })
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if (!m.message || m.key.fromMe) return
    const rawText = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").trim()
    const text = rawText.toLowerCase()
    const from = m.key.remoteJid; const sender = m.key.participant || from
    const isGroup = from.endsWith('@g.us')
    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quoted = m.message.extendedTextMessage?.contextInfo
    const owner = "201159299899"; const isOwner = sender.includes(owner)
    if (botOff[from] &&!isOwner &&!['فتح البوت','فتح بوت'].includes(text)) return
    if (!isGroup) return
    let isAdmin = false; try { const meta = await sock.groupMetadata(from); isAdmin =!!meta.participants.find(p => p.id === sender)?.admin || isOwner } catch {}
    const badWords = ['كس','شرموط','متناك','خول','عرص','قحبة','نيك','كسمك']
    const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me|wa\.me|\.com)/i
    if (badWords.some(w => text.includes(w)) || linkRegex.test(text)) {
      try {
        const meta = await sock.groupMetadata(from)
        const isSenderAdmin = meta.participants.find(p => p.id === sender)?.admin || isOwner
        if (!isSenderAdmin) {
          await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: m.key.id, participant: sender } })
          if (!warnings[from]) warnings[from] = {}
          warnings[from][sender] = (warnings[from][sender] || 0) + 1; saveWarnings()
          const c = warnings[from][sender]
          if (c === 1) await sock.sendMessage(from, { text: `⚠️ انذار 1 لـ @${sender.split('@')[0]}`, mentions: [sender] })
          else if (c === 2) await sock.sendMessage(from, { text: `⚠️ انذار 2 لـ @${sender.split('@')[0]}`, mentions: [sender] })
          else {
            await sock.sendMessage(from, { text: `برا يحيوان😋🫸🏻 @${sender.split('@')[0]}`, mentions: [sender] })
            await delay(500); await sock.groupParticipantsUpdate(from, [sender], 'remove')
            warnings[from][sender] = 0; saveWarnings()
          }
          return
        }
      } catch {}
    }
    if (['تحيه','تحية','سلام'].includes(text)) {
      if (!isOwner) return await sock.sendMessage(from, { text: `عذرا هذا الامر ملك الادمن😋🫸🏻` })
      if (fs.existsSync('./dragon.jpg')) await sock.sendMessage(from, { image: fs.readFileSync('./dragon.jpg'), caption: `*𝐈'𝐌 𝐃𝐑𝐀𝐆𝐎𝐍😋🫷🏻*` })
      else await sock.sendMessage(from, { text: `*𝐈'𝐌 𝐃𝐑𝐀𝐆𝐎𝐍😋🫷🏻*` })
      await delay(500); await sock.sendMessage(from, { text: `DRAGON BACK TO THE BAR😋🫸🏻` }); await delay(800)
      if (fs.existsSync('./lonely.mp3')) await sock.sendMessage(from, { audio: fs.readFileSync('./lonely.mp3'), mimetype: 'audio/mpeg', ptt: true })
      return
    }
    if (text === 'قفل البوت' || text === 'قفل بوت') { if (!isOwner) return await sock.sendMessage(from, { text: `عذرا هذا الامر ملك الادمن😋🫸🏻` }); botOff[from] = true; saveBotOff(); return sock.sendMessage(from, { text: `تم قفل البوت 🔒😴` }) }
    if (text === 'فتح البوت' || text === 'فتح بوت') { if (!isOwner) return await sock.sendMessage(from, { text: `عذرا هذا الامر ملك الادمن😋🫸🏻` }); botOff[from] = false; saveBotOff(); return sock.sendMessage(from, { text: `تم فتح البوت 🔓👑` }) }
    if (text.startsWith('هات اغنيه') || text.startsWith('هات اغنية') || text.startsWith('هات اغاني') || text.startsWith('غني') || text.startsWith('هات ')) {
      let query = rawText.replace(/هات اغنيه|هات اغنية|هات اغاني|غني|هات/i, '').trim()
      if (query && query.length >= 2) {
        await sock.sendMessage(from, { text: `🔍 بدور على *${query}*...` })
        try {
          const search = await yts(query); const video = search.videos[0]
          if (!video) return await sock.sendMessage(from, { text: `ملقتش 🥲` })
          await sock.sendMessage(from, { image: { url: video.thumbnail }, caption: `🎵 *${video.title}*\nبحملها فويس...` })
          const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
          await sock.sendMessage(from, { audio: { stream }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
          return
        } catch { return await sock.sendMessage(from, { text: `جرب تاني` }) }
      }
    }
    if (text === 'لونلي' && fs.existsSync('./lonely.mp3')) { await sock.sendMessage(from, { audio: fs.readFileSync('./lonely.mp3'), mimetype: 'audio/mpeg', ptt: true }); return }
    if (['اوامر','الاوامر','طرد','رفع','قفل','فتح','قفل جروب','فتح جروب','مسح'].some(c => text === c || text.startsWith(c + ' '))) {
      if (!isAdmin) return await sock.sendMessage(from, { text: `عذرا هذا الامر ملك الادمن😋🫸🏻` })
    }
    if (text === 'قفل جروب' || text === 'قفل') { await sock.groupSettingUpdate(from, 'announcement'); return sock.sendMessage(from, { text: `تم قفل الجروب 🔒` }) }
    if (text === 'فتح جروب' || text === 'فتح') { await sock.groupSettingUpdate(from, 'not_announcement'); return sock.sendMessage(from, { text: `تم فتح الجروب 🔓` }) }
    if (text.startsWith('طرد')) { const target = mentioned[0] || quoted?.participant; if (!target) return; await sock.groupParticipantsUpdate(from, [target], 'remove'); return sock.sendMessage(from, { text: `تم الطرد 👢` }) }
    if (text.startsWith('رفع')) { const target = mentioned[0] || quoted?.participant; if (!target) return; await sock.groupParticipantsUpdate(from, [target], 'promote'); return sock.sendMessage(from, { text: `تم الرفع ✅` }) }
    if (text === 'مسح' && quoted?.stanzaId) { await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: quoted.stanzaId, participant: quoted.participant } }); return }
  })
}
DragonBot()
