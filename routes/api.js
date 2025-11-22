/*
 * Serve JSON to our AngularJS client
 */

var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var fs = require('fs');

function requestWithFallback(url, callback) {
  request(url, function (error, response, html) {
    if (!error && response.statusCode === 200) {
      callback(error, response, html);
    } else {
      console.log('Primary source failed, trying Wayback Machine for:', url);
      var waybackUrl = 'https://web.archive.org/web/20250920124038/' + url;
      request(waybackUrl, function (wbError, wbResponse, wbHtml) {
        callback(wbError, wbResponse, wbHtml);
      });
    }
  });
}

function exportIndex(req, res, next, isSeasonsList = false) {
  return function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html), result = [];
      if (isSeasonsList) {
        var customSeason = ['00', 'Custom Games', 'All eternity', '(1 game available)', ''];
        result.push(_.zipObject(['id', 'name', 'description', 'note'], customSeason));
      }
      $('#content table tr').each(function () {
        var data = $(this), row = [];
        data.children().each(function (i, element) {
          if (i == 0) {
            var link = $('a', element).first().attr('href');
            // Handle Wayback Machine URLs
            if (link.includes('web.archive.org')) {
              // Extract the original URL part or just find the parameter
              // Wayback URL: https://web.archive.org/web/.../http://j-archive.com/showgame.php?game_id=123
              // We just need the part after the last '=' of the query string usually, but let's be safe.
              // The original logic was: link.substring(link.indexOf('=') + 1, link.length)
              // If link is ...?game_id=123, indexOf('=') is correct.
              // If link is ...?season=12, indexOf('=') is correct.
              // If Wayback rewrites it, it might be .../http://j-archive.com/showseason.php?season=12
              // The first '=' might be in the timestamp if it was weird, but usually it's fine.
              // However, let's use lastIndexOf to be safer if there are multiple '='?
              // No, the original logic used indexOf which finds the FIRST '='.
              // For `showseason.php?season=12`, first '=' is right.
              // For `https://web.archive.org/.../http://j-archive.com/showseason.php?season=12`, first '=' is still right (assuming no '=' in wayback prefix).
              // But wait, if the original link was relative `showseason.php?season=12`, Wayback makes it absolute.
              // Let's stick to the original logic but ensure we are looking at the right part.
              // Actually, if we just take everything after the last '=' it might be safer for IDs?
              // But `season=12` -> `12`. `game_id=123` -> `123`.
              // What if there are other params?
              // Let's trust `indexOf('=')` but maybe verify if it looks like a URL.
            }
            link = link.substring(link.lastIndexOf('=') + 1, link.length);
            row.push(link);
          }
          row.push($(element).text().trim());
        });

        //console.log(row);
        result.push(_.zipObject(['id', 'name', 'description', 'note'], row));
      });

      res.json(result);
    }
    else {
      next(error);
    }
  };
}

function exportRound($, context, r) {
  var result = {};
  var round = $(r !== 'FJ' ? 'table.round' : 'table.final_round', context);

  // Export categories
  $('tr', round).first().children().each(function (i, element) {
    var data = $(this);
    result[['category', r, i + 1].join('_')] = {
      category_name: $('.category_name', data).text(),
      category_comments: $('.category_comments', data).text(),
      media: $('a', data).length ? $('a', data).map(function (i, element) {
        var href = $(this).attr('href');
        // Remove Wayback prefix if present to normalize to localhost proxy
        href = href.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\//, '');
        return href.replace('http://www.j-archive.com/',
          'http://localhost:3000/');
      }).toArray() : undefined
    };
  });

  // Export clues
  $('.clue_text', round).not('[id$="_r"]').each(function (i, element) {
    var data = $(this);
    var header = data.parent().prev();
    if (r === 'FJ') {
      header = data.parent().parent().parent().parent().prev();
    }

    var link = $('.clue_order_number a', header).attr('href');
    var daily_double = header.find('.clue_value_daily_double').length;

    result[data.attr('id')] = {
      id: link ? link.substring(link.lastIndexOf('=') + 1, link.length) : undefined,
      daily_double: daily_double ? true : undefined,
      triple_stumper: _.contains(data.html(), 'Triple Stumper') || undefined,
      clue_html: data.html(),
      clue_text: data.text(),
      correct_response: header.next().find('.correct_response').text(),
      media: $('a', data).length ? $('a', data).map(function (i, element) {
        var href = $(this).attr('href');
        href = href.replace(/^https?:\/\/web\.archive\.org\/web\/\d+\//, '');
        return href.replace('http://www.j-archive.com/',
          'http://localhost:3000/');
      }).toArray() : undefined
    };
  });

  return result;
}

exports.seasons = function (req, res, next) {
  requestWithFallback('http://www.j-archive.com/listseasons.php', exportIndex(req, res, next, true));
};

exports.season = function (req, res, next) {
  if (req.params.id === '00') {
    // List custom games
    var gamesPath = 'games/'
    fs.readdir(gamesPath, function (err, items) {
      var games = [];

      for (var i = 0; i < items.length; i++) {
        var customGameLite = {};
        if (items[i] === '.gitkeep') {
          continue;
        }
        var customGame = JSON.parse(fs.readFileSync(gamesPath + items[i], 'utf8'));
        customGameLite.id = customGame.id;
        customGameLite.name = customGame.game_title;
        customGameLite.note = customGame.game_comments;
        customGameLite.description = "No description available";
        games.push(customGameLite);
      }
      res.json(games);
    });

  } else {
    requestWithFallback('http://www.j-archive.com/showseason.php?season=' + req.params.id, exportIndex(req, res, next, false));
  }
}

exports.game = function (req, res, next) {
  var gameUrl;
  if (req.params.id.startsWith('00')) {
    fs.readFile('games/' + req.params.id + '.json', 'utf8', function (err, data) {
      if (err) {
        next(err);
      }
      else {
        file = JSON.parse(data);

        var result = {
          id: req.params.id,
          game_title: file.title,
          game_comments: file.comments,
          game_complete: false,
        };

        result = _.assign(result, file.J, file.DJ, file.FJ);

        result.game_complete = _.countBy(_.keys(result), function (n) {
          return n.split('_')[0];
        }).clue === (30 + 30 + 1);

        var clueCounts = _.countBy(_.keys(result), function (n) {
          return n.split('_').slice(0, 3).join('_');
        });

        _.forEach(result, function (n, key) {
          if (_.startsWith(key, 'category')) {
            n.clue_count = clueCounts[key.replace('category', 'clue')];
          }
        });

        res.json(result);
      }
    });
  } else {
    gameUrl = 'http://www.j-archive.com/showgame.php?game_id=' + req.params.id;
    requestWithFallback(gameUrl, function (error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);

        var result = {
          id: req.params.id,
          game_title: $('#game_title').text(),
          game_comments: $('#game_comments').text(),
          game_complete: false
        };

        _.assign(result,
          exportRound($, $('#jeopardy_round'), 'J'),
          exportRound($, $('#double_jeopardy_round'), 'DJ'),
          exportRound($, $('#final_jeopardy_round'), 'FJ'));

        result.game_complete = _.countBy(_.keys(result), function (n) {
          return n.split('_')[0];
        }).clue === (30 + 30 + 1);

        var clueCounts = _.countBy(_.keys(result), function (n) {
          return n.split('_').slice(0, 3).join('_');
        });

        _.forEach(result, function (n, key) {
          if (_.startsWith(key, 'category')) {
            n.clue_count = clueCounts[key.replace('category', 'clue')];
          }
        });

        res.json(result);
      }
      else {
        next(error);
      }
    });
  }
}
