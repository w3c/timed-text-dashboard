var main = document.getElementsByTagName('main')[0];

function get(url) {
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url);

        req.onload = function() {
            if (req.status == 200) {
                resolve(req.response);
            } else {
                reject(Error(req.statusText));
            }
        };

        req.onerror = function() {
            reject(Error("Network Error"));
        };

        req.send();
    });
}

function sortIssues(a, b) {
  var now = new Date(),
      aDate = new Date(Date.parse(a.updated_at)),
      bDate = new Date(Date.parse(b.updated_at)),
      aScore = 0,
      bScore = 0;

  // flag bugs with long idle time
  var aScore = ((now-aDate)/1000)/(60*60*24),
      bScore = ((now-bDate)/1000)/(60*60*24);

  // push bugs with less activity to the top
  aScore += b.comments - a.comments,
  bScore += a.comments - b.comments;

  // push enhancements down on priority list
  a.labels.forEach(function(label){
    if (label.name == 'enhancement') { aScore -= 100 }
  })
  b.labels.forEach(function(label){
    if (label.name == 'enhancement') { bScore -= 100 }
  })

  if (aScore < bScore)
    return 1;
  if (aScore > bScore)
    return -1;
  return 0;
}

function getIssues(spec, cb) {
    get('https://api.github.com/repos/' + spec.repo + '/issues').then(
        function(response) {
            spec.issues = JSON.parse(response).sort(sortIssues);
            cb(spec);
        },
        function(error) {
            spec.error = error;
            cb(spec);
        }
    );
}

Handlebars.registerHelper('pluralize', function(number, single, plural) {
  if (number === 1) { return single; }
  else { return plural; }
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('dateFormat', function(time) {
  return moment(time).fromNow()
});

Handlebars.registerHelper('dateColor', function(time) {
  var time = new Date(Date.parse(time)),
       now = new Date();

  if (((now-time)/1000)/(60*60*24) > 14) {
    return "color--red"
  } else {
    return "color--green"
  }
});

var source   = document.getElementById("entry-template").innerHTML;
var template = Handlebars.compile(source);


var specs = [
  {name: 'TTML 1', repo: 'w3c/ttml1'},
  {name: 'TTML 2', repo: 'w3c/ttml2' },
  {name: 'IMSC', repo: 'w3c/imsc'}
]

specs.forEach(function(spec){
  getIssues(spec, function(issues) {
    // console.dir(issues)
    main.innerHTML += template(spec);
  })
})

