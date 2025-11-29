/*
 * Serve JSON to our AngularJS client
 */

var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var fs = require('fs');

var headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
};

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
            link = link.substring(link.indexOf('=') + 1, link.length)
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
        return $(this).attr('href').replace('http://www.j-archive.com/',
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
      id: link ? link.substring(link.indexOf('=') + 1, link.length) : undefined,
      daily_double: daily_double ? true : undefined,
      triple_stumper: _.contains(data.html(), 'Triple Stumper') || undefined,
      clue_html: data.html(),
      clue_text: data.text(),
      correct_response: header.next().find('.correct_response').text(),
      media: $('a', data).length ? $('a', data).map(function (i, element) {
        return $(this).attr('href').replace('http://www.j-archive.com/',
          'http://localhost:3000/');
      }).toArray() : undefined
    };
  });

  return result;
}

exports.seasons = function (req, res, next) {
  request({
    url: 'http://www.j-archive.com/listseasons.php',
    headers: headers
  }, exportIndex(req, res, next, true));
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
    request({
      url: 'http://www.j-archive.com/showseason.php?season=' + req.params.id,
      headers: headers
    }, exportIndex(req, res, next, false));
  }
}

exports.game = function (req, res, next) {
  var gameUrl;
  if (req.params.id.startsWith('custom_') || req.params.id.startsWith('00')) {
    fs.readFile('games/' + req.params.id + '.json', 'utf8', function (err, data) {
      if (err) {
        next(err);
      }
      else {
        file = JSON.parse(data);

        if (req.params.id.startsWith('custom_')) {
          // Custom game format is already in the correct structure
          res.json(file);
          return;
        }

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
    request({
      url: gameUrl,
      headers: headers
    }, function (error, response, html) {
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

// Handler for saving custom games
exports.saveGame = function (req, res, next) {
  try {
    var game = req.body;

    // Generate ID if not provided
    if (!game.id || (!game.id.startsWith('custom_') && !game.id.startsWith('00'))) {
      game.id = 'custom_' + new Date().getTime();
    }

    // Ensure the games directory exists
    if (!fs.existsSync('games')) {
      fs.mkdirSync('games');
    }

    // Save the game to file
    fs.writeFileSync('games/' + game.id + '.json', JSON.stringify(game, null, 2));

    res.json({ success: true, id: game.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handler for deleting custom games
exports.deleteGame = function (req, res, next) {
  try {
    var gameId = req.params.id;

    // Only allow deletion of custom games
    if (!gameId.startsWith('custom_') && !gameId.startsWith('00')) {
      return res.status(403).json({ error: 'Can only delete custom games' });
    }

    var filePath = 'games/' + gameId + '.json';

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
