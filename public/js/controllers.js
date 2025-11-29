'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('SeasonsCtrl', function ($scope, response) {
    $scope.data = response.data;
    
    // Check if we're showing the custom games section
    $scope.isCustomGamesSection = function() {
      return $scope.data.length > 0 && $scope.data[0].id === '00';
    };
  }).
  controller('SeasonCtrl', function ($scope, $stateParams, $http) {
    $scope.id = $stateParams.id;
    $scope.data = [];
    
    // Load data
    function loadData() {
      $http.get('/api/seasons/' + $stateParams.id).then(function(response) {
        $scope.data = response.data;
      });
    }
    
    // Initial data load
    loadData();
    
    // Check if we're in the custom games section
    $scope.isCustomGamesSection = function() {
      return $scope.id === '00';
    };
    
    // Add delete function for custom games
    $scope.deleteGame = function(gameId) {
      if (confirm('Are you sure you want to delete this game?')) {
        $http.delete('/api/games/' + gameId)
          .then(function() {
            // Remove game from list
            $scope.data = $scope.data.filter(function(game) {
              return game.id !== gameId;
            });
          }, function(error) {
            alert('Error deleting game: ' + (error.data.error || 'Unknown error'));
          });
      }
    };
  });
