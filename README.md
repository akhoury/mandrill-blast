mandrill-blast
==============

quick and dirty way to blast a CSV list of emails with template data using Node and the Mandrill API

### Install
You need to have [NodeJS](http://nodejs.org/) installed and running, then
```bash
npm install mandrill-blast
```
OR
```bash
git clone https://github.com/akhoury/mandrill-blast.git
```

### Usage
```bash
cd mandrill-blast
node blast.js --source="sample.emails.csv" --key="0123456789" --template="sample.template.html" --from="you@example.com" --to-email-column="email" --subject="Hi {{name}}" --to-name-column="name"
```

### CSV
__MUST__ have headers for each column, at the top
```csv
id,email,name,friend,location,token
1,dude@example.com,gooby,derp,fakeville,123456789
2,dudette@example.com,goobette,derpina,fakecity,987654321
```

### Templates
uses [Handlerbars](http://handlebarsjs.com/) format for templating,
it's pretty simple see [sample.template.html](sample.template.html) for an example.

### Mandrill API

You need an account and a valid API Key, get one at [mandrill.com](http://mandrill.com/)

### Todo
Anything that the heart desires, I needed this as a 10 minutes hack and it got the job done, if you have ideas or needs, submit a pull or feature request.