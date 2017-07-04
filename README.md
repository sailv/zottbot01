# Zott Bot 01
Demo Project of www.go-db.com for Chat Bots

## Non-Functional Aspects (Common across all Zott Bots)
### Bot App - running
Runs as a Microsoft Azure Bot Service, and Bot Framework.
This enables it to integrate with its various Channels (Facebook, Skype, Email, Web etc)

### NLP 
Uses Microsoft LUIS API and its extensive capabilities
This allows the Bot 

## Functional aspects (specific to each Zott Bot)
### Conversational Flow Design
Conventional approach requires creating the Dialog flow and form validation equivalents in JavaScript / C#  code by Developers.
Zott Bots connversation deisgn happens by Business Analysts in Microsoft Excel !
This is done via http://xlapp.io service which allows XLS to be convered to JavaScript botlets
Such Botlets can be hosted on Enterprise's choice of servers - Onpremise / Cloud.

To build your own bots contact sales@godbtech.com

## Possible Errors & its workarounds
### Bug in Microsoft's Bot library.js
".\messages\node_modules\botbuilder\lib\bots\Library.js" might throw an error stating "logger" function undefined.
This bug is to be manually fixed by copy-replacing it with the Library.js in ".\messages" folder.
