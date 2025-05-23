'use strict';

angular.module('myApp.controllers')
  .controller('EditorCtrl', function ($scope, $http, $stateParams, $window, response) {
    // Initialize with template or loaded game
    $scope.gameId = $stateParams.id || null;
    
    // Set up empty game structure if no game loaded
    if (response.data) {
      $scope.game = response.data;
    } else {
      // Create empty game template
      $scope.game = {
        id: 'custom_' + new Date().getTime(),
        game_title: 'Custom Game',
        game_comments: 'Created with Jeopardy Editor',
        game_complete: true
      };
      
      // Initialize categories and clues for both rounds
      ['J', 'DJ'].forEach(function(round) {
        // Create 6 categories per round
        for (var i = 1; i <= 6; i++) {
          $scope.game['category_' + round + '_' + i] = {
            category_name: 'Category ' + i,
            category_comments: '',
            clue_count: 5
          };
          
          // Create 5 clues per category
          for (var j = 1; j <= 5; j++) {
            $scope.game['clue_' + round + '_' + i + '_' + j] = {
              clue_html: 'Clue ' + j,
              clue_text: 'Clue ' + j,
              correct_response: 'Response ' + j,
              daily_double: false,
              triple_stumper: false
            };
          }
        }
      });
      
      // Create Final Jeopardy
      $scope.game['category_FJ_1'] = {
        category_name: 'Final Category',
        category_comments: '',
        clue_count: 1
      };
      
      $scope.game['clue_FJ_1_1'] = {
        clue_html: 'Final Jeopardy Clue',
        clue_text: 'Final Jeopardy Clue',
        correct_response: 'Final Response'
      };
    }
    
    // Selected round and category for editing
    $scope.editor = {
      round: 'J',
      category: 1,
      clue: 1
    };
    
    // Functions for changing editor selection
    $scope.selectRound = function(round) {
      $scope.editor.round = round;
      $scope.editor.category = 1;
      $scope.editor.clue = 1;
    };
    
    $scope.selectCategory = function(category) {
      $scope.editor.category = category;
      $scope.editor.clue = 1;
    };
    
    $scope.selectClue = function(clue) {
      $scope.editor.clue = clue;
    };
    
    // Get current category/clue based on editor selection
    $scope.getCurrentCategory = function() {
      return $scope.game['category_' + $scope.editor.round + '_' + $scope.editor.category];
    };
    
    $scope.getCurrentClue = function() {
      if ($scope.editor.round === 'FJ') {
        return $scope.game['clue_FJ_1_1'];
      } else {
        return $scope.game['clue_' + $scope.editor.round + '_' + $scope.editor.category + '_' + $scope.editor.clue];
      }
    };
    
    // Save game to server
    $scope.saveGame = function() {
      // If editing existing game, ask for confirmation
      if ($scope.gameId && $scope.gameId === $scope.game.id && 
          !confirm("Save changes to existing game?\n\nGame ID: " + $scope.game.id)) {
        return;
      }
      
      $http.post('/api/games', $scope.game)
        .then(function(response) {
          alert('Game saved successfully!');
          if (!$scope.gameId) {
            $scope.gameId = response.data.id;
          }
        }, function(error) {
          alert('Error saving game: ' + (error.data.error || 'Unknown error'));
        });
    };
    
    // Save as a new game (duplicate)
    $scope.saveAsNew = function() {
      // Create a copy of the game with a new ID
      var gameCopy = angular.copy($scope.game);
      gameCopy.id = 'custom_' + new Date().getTime();
      gameCopy.game_title += ' (Copy)';
      
      $http.post('/api/games', gameCopy)
        .then(function(response) {
          if (confirm('Game saved as a new copy! Would you like to edit the new copy?')) {
            $scope.game = gameCopy;
            $scope.gameId = gameCopy.id;
          }
          alert('New game created with ID: ' + gameCopy.id);
        }, function(error) {
          alert('Error saving game: ' + (error.data.error || 'Unknown error'));
        });
    };
    
    // Download game as JSON file
    $scope.downloadGame = function() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($scope.game, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "jeopardy_game_" + $scope.game.id + ".json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };
    
    // Import game from JSON file
    $scope.importGame = function() {
      document.getElementById('gameFileInput').click();
    };
    
    $scope.handleFileSelect = function(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          try {
            $scope.$apply(function() {
              $scope.game = JSON.parse(e.target.result);
              $scope.gameId = null; // Reset game ID since this is an import
            });
            alert('Game imported successfully!');
          } catch (error) {
            alert('Error parsing file: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
  });
