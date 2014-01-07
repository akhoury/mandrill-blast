var argv = require('optimist').argv,
	fs = require('fs'),
	csv = require('csv'),
	Handlebars = require('handlebars'),
	Mandrill = require('node-mandrill'),

	usage = function(notice) {
		if (notice) console.log('\n' + notice);

		console.log(+''
			+ '\nUsage: node blast --source="file.csv" --key="123456789" --template="template.html" --from="you@example.com" --to-email-column="email" --subject="Hi {{name}}" --to-name-column="firstname"'
			+ '\n\nthis tool will email your csv emails list, with their respective attributes replaced from a template, using Mandrill API'
			+ '\n-s | --source	: [REQUIRED] input csv file of emails, see emails.csv for a sample'
			+ '\n-t | --template	: [REQUIRED] input template, can be any type text, or html, see template.html to find out how to write the Dynamic fields'
			+ '\n-k | --key	: [REQUIRED] Your Mandrill API key'
			+ '\n-f | --from : [REQUIRED] Your "from_email" '
			+ '\n-tec | --to-email-column : [REQUIRED] which {{COLUMN-NAME}} would like to use for the "email" field, such as --to-email-column="emailaddress", the script will look for the "emailaddress" value of each row and use it as the to.email'
			+ '\n-s | --subject : [OPTIONAL] The Email "subject", you can use template in it, such as --email-subject="Hello {{name}}", optional, defaults to blank.'
			+ '\n-tnc | --to-name-column : [OPTIONAL] which {{COLUMN}} would like to use for the "name" field, such as --to-name-column="firstname", the script will look for the "firstname" value of each row and use it as the "name" in the receiver\'s info, optional, defaults to blank'
		);
	},

	error = function (msg) {
		usage();
		throw new Error(msg);
	},

	validateEmail = (function () {
		var re = /\S+@\S+\.\S+/;
		return function (email){
			return re.test(email) ? email : null;
		};
	})(),

	truncateStr = function (str, len) {
		if (typeof str != 'string') return str;
		len = !isNaN(parseFloat(len)) && isFinite(len) && len > 3 ? len : 20;
		return str.length <= len ? str : str.substr(0, len - 3) + '...';
	};

// sanity checks

var sourceFile = argv.s || argv.source;
if (!sourceFile) error ('You must provide a CSV file with the receivers data');
if (!fs.existsSync(sourceFile)) error(sourceFile + ' does not exist or cannot be read.');

var templateFile = argv.t || argv.template, bodyTemplate;
if (!templateFile) error('You must provide a template file');
console.log('reading ' + templateFile);
if (!fs.existsSync(templateFile)) error(templateFile + ' does not exist or cannot be read.');
else bodyTemplate = Handlebars.compile((fs.readFileSync(templateFile) || '<h2>EMPTY TEMPLATE</h2>').toString());

if (!argv.k && !argv.key) error('You need to provide a valid Mandrill API key.');
var mandrill = Mandrill(argv.k || argv.key);

var emailFrom = argv.f || argv.from;
if (!emailFrom) error('You must provide a "from" email.');

var toEmailColumn = argv.tec || argv['to-email-column'];
if (!toEmailColumn) error('You must provide a "to-email-column", basically, which column of each row is the email-address to send to');

var toNameColumn = argv.tnc || argv['to-name-column'];


var subjectTemplate = Handlebars.compile(argv.s || argv.subject || '');

console.log('reading ' + sourceFile);
csv()
	.from.path(sourceFile, {
		delimiter: ',',
		escape: '"',
		columns: true
	})
	.on('record', function(data, i, a, b, c) {

		var message = {
			to: [{email: validateEmail(data[toEmailColumn]), name: toNameColumn ? data[toNameColumn] : ''}],
			from_email: emailFrom,
			subject: subjectTemplate(data),
			html: bodyTemplate(data),
			text: bodyTemplate(data),
			auto_text: true
		};

		if (message.to[0].email && message.text) {
			console.log('[i: ' + i + '] sending, from ' + emailFrom + ', to ' + message.to[0].email + ', subject: ' + message.subject + ', truncated-body: ' + truncateStr(message.text, 20) + '\n\n');

			mandrill('/messages/send', {message: message}, function(error, response) {
				if (error) console.log(JSON.stringify(error));
				else console.log(response);
			});
		} else {
			console.log('[i:' + i + '] Skipping record: ' + JSON.stringify(data) + (!message.to[0].email ? ' [email is invalid]' : ' [body is blank]'));
		}
	})
	.on('end', function(count){
		console.log('Number of rows processed: ' + count);
	})
	.on('error', function(error){
		console.log(error.message);
	});
