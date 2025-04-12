# Bot Command Setter
Bot Command Setter can help you set commands to set and unset Telegram bot commands, names, ‘about’ texts, and descriptions.

## Installation
```
npm i bot-command-setter
```

## Usage
```
const { Bot } = require('grammy')
const { Telegraf } = require('telegraf')
const BotCommandSetter = require('bot-command-setter')
// import { Bot } from 'grammy'
// import { Telegraf } from 'telegraf'
// import BotCommandSetter from 'bot-command-setter'

const bot = new Bot('BOT_TOKEN') // grammy
// const bot = new Telegraf('BOT_TOKEN') // telegraf

new BotCommandSetter(bot, {
  admins: [ 1234567890 ],
  languages: { default: 'en' },
  info: {
    titles: {
      en: 'My Bot',
      es: 'Mi bot'
    },
    bios: {
      en: 'My Bot Short Description',
      es: 'Descripción breve de mi bot'
    },
    descriptions: {
      en: 'My Bot Description',
      es: 'Descripción de mi bot'
    }
  },
  commands: [
    {
      type: 'default',
      code: 'en',
      list: {
        start: '',
        help: 'display a help message',
        settings: 'display my settings',
        privacy: 'display your privacy policy'
      }
    }
  ]
}).setAdminCommands() && bot.start() // bot.launch()
```

Now you can use the following commands:
```
/setCommands — set bot commands
/unsetCommands — unset bot commands
/setTitles — set bot names
/unsetTitles — unset bot names
/setBios — set bot ‘about’ texts
/unsetBios — unset bot ‘about’ texts
/setDescriptions — set bot descriptions
/unsetDescriptions — unset bot descriptions
```

## Contributing
Contributions are only allowed in TON:
```
UQCYqT9-ycmXE3o57Cac1sM5ntIKdjqIwP3kzWmiZik0VU_b
```