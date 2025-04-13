import { STYLES, html, link, symbol, ln } from 'teleform'

export { BotCommandSetter }

class BotCommandSetter {
  #maxlen = 3840

  #emojis = {
    done: '✅',
    finish: '👌',
    failed: '❌',
    progress: [
      '🕛', '🕐', '🕑', '🕒',
      '🕓', '🕔', '🕕', '🕖',
      '🕗', '🕘', '🕙', '🕚'
    ]
  }

  #botCommand = [
    'command',
    'description'
  ]
  #settingMethods = {
    title: 'setMyName',
    bio: 'setMyShortDescription',
    description: 'setMyDescription'
  }

  #sendingQueue = [ ]
  #hasQueue = false
  #sendingOptions = { }

  constructor(bot, config) {
    this._config = config
    this._bot = bot
    this._api = this.#frameworkApi(bot)
    this.#adjustFramework()
  }

  #frameworkApi(instance) {
    switch (true) {
      default: throw 'Instance of unknown type is passed'
      case typeof instance.api !== 'undefined': return 'grammy'
      case typeof instance.telegram !== 'undefined': return 'telegraf'
    }
  }
  #adjustFramework() {
    switch (this._api) {
      case 'grammy': return this.#addGrammyRequest()
      case 'telegraf': return this.#addTelegrafRequest()
    }
  }
  #adjustContext(ctx) {
    switch (this._api) {
      case 'grammy': return this.#amendGrammyContext(ctx)
      case 'telegraf': return this.#amendTelegrafContext(ctx)
    }
  }

  #addGrammyRequest() {
    this._bot.request = {
      setMyName: (input, language_code) => {
        return this._bot.api.setMyName(input, { language_code })
      },
      setMyShortDescription: (input, language_code) => {
        return this._bot.api.setMyShortDescription(input, { language_code })
      },
      setMyDescription: (input, language_code) => {
        return this._bot.api.setMyDescription(input, { language_code })
      },
      setMyCommands: (commands, scope, language_code) => {
        return this._bot.api.setMyCommands(commands, { scope, language_code })
      },
      deleteMyCommands: (scope, language_code) => {
        return this._bot.api.deleteMyCommands({ scope, language_code })
      },
      setMyDefaultAdministratorRights: (rights, for_channels) => {
        const args = { rights, for_channels }
        return this._bot.api.setMyDefaultAdministratorRights(args)
      }
    }
  }
  #addTelegrafRequest() {
    this._bot.request = {
      setMyName: (input, language_code) => {
        return this._bot.telegram.setMyName(input, language_code)
      },
      setMyShortDescription: (input, language_code) => {
        return this._bot.telegram.setMyShortDescription(input, language_code)
      },
      setMyDescription: (input, language_code) => {
        return this._bot.telegram.setMyDescription(input, language_code)
      },
      setMyCommands: (commands, scope, language_code) => {
        const other = { scope, language_code }
        return this._bot.telegram.setMyCommands(commands, other)
      },
      deleteMyCommands: (scope, language_code) => {
        const other = { scope, language_code }
        return this._bot.telegram.deleteMyCommands(other)
      },
      setMyDefaultAdministratorRights: (rights, for_channels) => {
        const other = { rights, forChannels: for_channels }
        return this._bot.telegram.setMyDefaultAdministratorRights(other)
      }
    }
  }
  #amendGrammyContext(ctx) {
    const other = { parse_mode: STYLES.html }
    ctx.send = text => ctx.reply(text, other)
    ctx.edit = (chat_id, message_id, text) => {
      const args = [ chat_id, message_id, text, other ]
      return this._bot.api.editMessageText(...args)
    }
  }
  #amendTelegrafContext(ctx) {
    const other = { parse_mode: STYLES.html }
    ctx.send = text => ctx.replyWithHTML(text)
    ctx.edit = (chat_id, message_id, text) => {
      const args = [ chat_id, message_id, , text, other ]
      return this._bot.telegram.editMessageText(...args)
    }
  }

  #sleep(time = Math.SQRT2) {
    return new Promise(resolve => setTimeout(resolve, time * 1000))
  }
  #fromAdmin(user) {
    return user && this._config.admins && this._config.admins.includes(user.id)
  }

  #addToQueue(method) {
    this.#sendingQueue.push(method)
  }
  async #processQueue() {
    if (this.#hasQueue) return
    else this.#hasQueue = true

    while (this.#sendingQueue.length > 0)
      await this.#sendingQueue.shift()()

    this.#hasQueue = false
  }

  #infoItem(vector, key, value) {
    return vector ? value : key === 'title' ? '⸻' : ''
  }
  #commands(list) {
    return Object.entries(list)
      .filter(([ , description ]) => description)
      .map(value => Object.assign(
        ...this.#botCommand.map((key, i) => ({ [key]: value[i] }))
      ))
  }
  #commandScope(info) {
    return {
      type: info.type,
      ...(info.chat_id ? { chat_id: info.chat_id } : { }),
      ...(info.user_id ? { user_id: info.user_id } : { })
    }
  }
  #textPrefix(vector) {
    return vector ? 'S' : 'Uns'
  }
  #icon(status) {
    switch (status) {
      case true:
        status = [ 'done' ]
        break
      case null:
        status = [ 'finish' ]
        break
      case false:
        status = [ 'failed' ]
        break
      default:
        status = [ 'progress', status % 11 ]
    }
    if (typeof status[1] === 'undefined')
      return this.#emojis[status[0]] + ' '
    else return this.#emojis[status[0]][status[1]] + ' '
  }
  #arrayItemsLength(array) {
    return array.reduce((length, item) => length + item.length, 0)
  }
  #adjustedText() {
    const length = this.#sendingOptions.text.length
    if (length <= this.#maxlen) return this.#sendingOptions.text
    const excessLength = length - this.#maxlen
    const lines = this.#sendingOptions.text.split(ln())
    const navel = Math.floor((lines.length - 2) / 2 + 2)
    let i = 0, chars = 0
    while (chars < excessLength) {
      const extra = lines.slice(navel - ++i, navel + i)
      chars = this.#arrayItemsLength(extra) + extra.length - 1
    }
    const dot = symbol('.')
    return lines.toSpliced(navel - i, i + i, dot + dot + dot).join(ln())
  }

  setAdminCommands() {
    if (this._config.info)
      this.#sendCommandsRelatedToInfo()
    if (this._config.rights)
      this.#sendCommandsRelatedToRights()
    if (this._config.commands)
      this.#sendCommandsRelatedToCommands()
    return true // all admin commands are set
  }
  #sendCommandsRelatedToInfo() {
    for (const [ name, method ] of Object.entries(this.#settingMethods)) {
      const info = this._config.info[`${name}s`]
      if (info) {
        const args = [ 'info', method, info, name ]
        this._bot.hears(new RegExp(`^/unset${name}s(?:\\s|$)`, 'i'), ctx => {
          this.#addToQueue(() => this.#settingCommand(false, ...args)(ctx))
          this.#processQueue()
        })
        this._bot.hears(new RegExp(`^/set${name}s(?:\\s|$)`, 'i'), ctx => {
          this.#addToQueue(() => this.#settingCommand(true, ...args)(ctx))
          this.#processQueue()
        })
      }
    }
  }
  #sendCommandsRelatedToRights() {
    const method = 'setMyDefaultAdministratorRights'
    const args = [ 'rights', method, this._config.rights, 'rights' ]
    this._bot.hears(/^\/unsetrights(?:\s|$)/i, ctx => {
      this.#addToQueue(() => this.#settingCommand(false, ...args)(ctx))
      this.#processQueue()
    })
    this._bot.hears(/^\/setrights(?:\s|$)/i, ctx => {
      this.#addToQueue(() => this.#settingCommand(true, ...args)(ctx))
      this.#processQueue()
    })
  }
  #sendCommandsRelatedToCommands() {
    const [ unset, set ] = [ 'deleteMyCommands', 'setMyCommands' ]
    const baseArgs = [ this._config.commands, 'commands' ]
    this._bot.hears(/^\/unsetcommands(?:\s|$)/i, ctx => {
      const args = [ false, baseArgs[1], unset, ...baseArgs ]
      this.#addToQueue(() => this.#settingCommand(...args)(ctx))
      this.#processQueue()
    })
    this._bot.hears(/^\/setcommands(?:\s|$)/i, ctx => {
      const args = [ true, baseArgs[1], set, ...baseArgs ]
      this.#addToQueue(() => this.#settingCommand(...args)(ctx))
      this.#processQueue()
    })
  }

  #settingCommand(vector, type, method, data, name) {
    const prefix = this.#textPrefix(vector)
    const args = [ vector, prefix, method, data, name ]
    switch (type) {
      case 'info': return this.#settingInfoCommand(...args)
      case 'rights': return this.#settingRightsCommand(...args)
      case 'commands': return this.#settingCommandsCommand(...args)
    }
  }
  #settingInfoCommand(vector, prefix, method, data, name) {
    return async ctx => {
      if (!this.#fromAdmin(ctx.from)) return
      let i = 0, txt = `${prefix}etting bot ${name}s`
      if (!(await this.#inform(ctx, i, html.b(txt)))) return
      for (const code in data) {
        const argument = this.#infoItem(vector, name, data[code])
        if (code === this._config.languages?.default) {
          try {
            await this._bot.request[method](argument)
          } catch (error) {
            return this.#report(ctx, error.message)
          }
          txt = `${prefix}et default ${name}`
          if (!(await this.#inform(ctx, ++i, txt))) return
        }
        try {
          await this._bot.request[method](argument, code)
        } catch (error) {
          return this.#report(ctx, error.message)
        }
        txt = `${prefix}et ${code.toUpperCase()} ${name}`
        if (!(await this.#inform(ctx, ++i, txt))) return
      }
      txt = `Bot ${name}s are ${prefix.toLowerCase()}et`
      if (!(await this.#inform(ctx, true, html.b(txt)))) return
    }
  }
  #settingRightsCommand(vector, prefix, method, data, name) {
    return async ctx => {
      if (!this.#fromAdmin(ctx.from)) return
      let i = 0, txt = `${prefix}etting bot ${name}`
      if (!(await this.#inform(ctx, i, html.b(txt)))) return
      for (const dedication in data) {
        const rights = vector ? data[dedication] : undefined
        const for_channels = dedication === 'channels'
        try {
          await this._bot.request[method](rights, for_channels)
        } catch (error) {
          return this.#report(ctx, error.message)
        }
        txt = `${prefix}et ${name} ${html.i(`for ${dedication}`)}`
        if (!(await this.#inform(ctx, ++i, txt))) return
      }
      txt = `Bot ${name} are ${prefix.toLowerCase()}et`
      if (!(await this.#inform(ctx, true, html.b(txt)))) return
    }
  }
  #settingCommandsCommand(vector, prefix, method, data, name) {
    return async ctx => {
      if (!this.#fromAdmin(ctx.from)) return
      let l, i = 0, txt = `${prefix}etting bot ${name}`
      if (!(await this.#inform(ctx, i, html.b(txt)))) return
      for (const info of data) {
        if (vector) l = this.#commands(info.list)
        if (!info.type) info.type = 'default'
        const type = info.type.split('_').join(' ')
        const scope = this.#commandScope(info)
        let txt1 = `${prefix}et `, txt2, txt3 = ''
        if ([ 'chat', 'chat_administrators' ].includes(info.type))
          txt3 = ` for chat ${html.code(info.chat_id.toString())}`
        else if (info.type === 'chat_member')
          txt3 = [
            ` for chat ${html.code(info.chat_id.toString())} `,
            html.link('member', link.user(info.user_id))
          ].join('')
        if (!info.code || info.code === this._config.languages?.default) {
          const args = l ? [ l, scope ] : [ scope ]
          try {
            await this._bot.request[method](...args)
          } catch (error) {
            return this.#report(ctx, error.message)
          }
          txt2 = `default ${html.i(type)} ${name}`
          if (!(await this.#inform(ctx, ++i, txt1 + txt2 + txt3))) return
        }
        if (info.code) {
          const args = l ? [ l, scope, info.code ] : [ scope, info.code ]
          try {
            await this._bot.request[method](...args)
          } catch (error) {
            return this.#report(ctx, error.message)
          }
          txt2 = `${info.code.toUpperCase()} ${html.i(type)} ${name}`
          if (!(await this.#inform(ctx, ++i, txt1 + txt2 + txt3))) return
        }
      }
      txt = `Bot ${name} are ${prefix.toLowerCase()}et`
      if (!(await this.#inform(ctx, true, html.b(txt)))) return
    }
  }

  async #report(ctx, msg) {
    const txt = this.#icon(false) + html.b(msg)
    if (!this.#sendingOptions.message_id)
      ctx.send(txt)
        .catch(error => console.error(error))
    else {
      const icon = this.#icon(this.#sendingOptions.icon)
      const adjustedText = this.#adjustedText()
      ctx.edit(
        ctx.from.id,
        this.#sendingOptions.message_id,
        icon + adjustedText + ln(2) + txt
      ).catch(error => console.error(error))
    }
  }
  async #inform(ctx, i, txt) {
    this.#adjustContext(ctx)
    await this.#sleep()
    const icon = this.#icon(i)
    this.#sendingOptions.icon = i
    if (i === 0) {
      try {
        const msg = await ctx.send(icon + txt)
        this.#sendingOptions.text = txt
        this.#sendingOptions.message_id = msg.message_id
      } catch (error) {
        return this.#report(ctx, error.message)
      }
    } else {
      if (i === true) txt = this.#icon(null) + txt
      const add = ln([ 1, true ].includes(i) ? 2 : 1) + txt
      this.#sendingOptions.text += add
      const adjustedText = this.#adjustedText()
      try {
        await ctx.edit(
          ctx.from.id,
          this.#sendingOptions.message_id,
          icon + adjustedText
        )
      } catch (error) {
        return this.#report(ctx, error.message)
      }
    }
    return await this.#sleep(Math.SQRT2) || true
  }
}
