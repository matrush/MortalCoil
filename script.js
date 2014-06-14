$(function() {

  function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == sParam) {
        return sParameterName[1];
      }
    }
  }

  function getSvgSize(gridSize, squareLength) {
    var width = gridSize.x * squareLength;
    var height = gridSize.y * squareLength;
    return { width:width, height:height };
  }

  function isBorder(x, y, gridSize) {
    return x == 0 || y == 0 || x == (gridSize.x - 1) || y == (gridSize.y - 1);
  }

  function buildMap(gridSize, ratios) {
    var map = { grid:[], grass:[], rock:[], lava:[], vis:[], x: 0, y: 0 };
    for (var x = 0; x < gridSize.x; x++) {
      map.grid[x] = [];
      map.vis[x] = [];
      for (var y = 0; y < gridSize.y; y++) {
        var rock = Math.random() < ratios.rock;
        var lava = Math.random() < ratios.lava;
        var type = isBorder(x, y, gridSize) ? "rock" : "grass";
        if(rock) {
          type = "rock";
        }
        if(lava) {
          type = "lava";
        }
        var cell = { x:x, y:y , type:type };
        map.grid[x][y] = cell;
        map.vis[x][y] = 0;
        map[type].push(cell);
      }
    }
    return map;
  }

  function buildMapFromString(mapString) {
    var map = { grid:[], grass:[], rock:[], lava:[], vis:[], x: 0, y: 0 };

    gridSize.x += 2;
    gridSize.y += 2;

    for (var x = 0; x < gridSize.x; x++) {
      map.grid[x] = [];
      var cell = { x: x, y: 0, type: "rock"};
      map.grid[x][0] = cell;
      cell = { x: x, y: gridSize.y - 1, type: "rock"};
      map.grid[x][gridSize.y - 1] = cell;
    }

    for (var y = 0; y < gridSize.y; y++) {
      var cell = { x: 0, y: y, type: "rock"};
      map.grid[0][y] = cell;
      cell = { x: gridSize.x - 1, y: y, type: "rock"};
      map.grid[gridSize.x - 1][y] = cell;
    }

    for (var x = 1; x < gridSize.x - 1; x++) {
      // map.grid[x] = [];
      // map.vis[x] = [];
      for (var y = 1; y < gridSize.y - 1; y++) {
        var rock = mapString[(y - 1) * (gridSize.x - 2) + x - 1] == 'X';
        var lava = false;
        var type = isBorder(x, y, gridSize) ? "rock" : "grass";
        if (rock) {
          type = "rock";
        }
        if (lava) {
          type = "lava";
        }
        var cell = { x: x, y: y, type: type };
        map.grid[x][y] = cell;
        // map.vis[x][y] = 0;
        // map[type].push(cell);
      }
    }
    for (var x = 0; x < gridSize.x; x++) {
      map.vis[x] = [];
      for (var y = 0; y < gridSize.y; y++) {
        map.vis[x][y] = 0;
        var type = map.grid[x][y].type;
        map[type].push(map.grid[x][y]);
      }
    }
    return map;
  }

  function rebuildMap(gridSize) {
    map.x = start.x;
    map.y = start.y;
    for (var x = 0; x < gridSize.x; x++) {
      for (var y = 0; y < gridSize.y; y++) {
        map.vis[x][y] = 0;
      }
    }
  }

  function getScale(gridSize, svgSize) {
    var xScale = d3.scale.linear().domain([0,gridSize.x]).range([0,svgSize.width]);
    var yScale = d3.scale.linear().domain([0,gridSize.y]).range([0,svgSize.height]);
    return { x:xScale, y:yScale };
  }

  function drawCells(svgContainer, scales, data, cssClass) {
    var gridGroup = svgContainer.append("g");
    var cells = gridGroup.selectAll("rect")
                .data(data)
                .enter()
                .append("rect");
    var cellAttributes = cells
             .attr("x", function (d) { return scales.x(d.x); })
             .attr("y", function (d) { return scales.y(d.y); })
             .attr("width", function (d) { return squareLength; })
             .attr("height", function (d) { return squareLength; })
             .attr("class", cssClass);
  }

  function drawMowerHistory(groups, scales, path) {
    // path
    groups.path.selectAll(".path").remove();
    var lineFunction = d3.svg.line()
               .x(function(d) { return scales.x(d.x + 0.5); })
               .y(function(d) { return scales.y(d.y + 0.5); })
               .interpolate("linear");

    var lineGraph = groups.path.append("path")
                              .attr("d", lineFunction(path))
                              .attr("class", "path")
                              .attr("fill", "none");

    // position
    var circleData = groups.position.selectAll("circle").data(path);
    circleData.exit().remove();
    var circles = circleData.enter().append("circle");
    var circleAttributes = circles
             .attr("cx", function (d) { return scales.x(d.x + 0.5); })
             .attr("cy", function (d) { return scales.y(d.y + 0.5); })
             .attr("r", function (d) { return circleRadius; })
             .attr("class", "position");

    // position number
    var textData = groups.position.selectAll("text").data(path);
    textData.exit().remove();
    var texts = textData.enter().append("text");
    var textAttributes = texts
             .attr("x", function (d) { return scales.x(d.x + 0.5); })
             .attr("y", function (d) { return scales.y(d.y + 0.5); })
             .attr("dy", ".31em")
             // .attr("font-size", "7")
             .text(function(d,i) { return i; })
             .attr("class", "positionNumber");
  }

  function pickRandomPosition(map) {
    var grass = map.grass;
    var i = Math.ceil(Math.random() * grass.length);
    return grass[i];
  }

  function getNext(map, current, command) {
    switch(command) {
      case "U":
        return map.grid[current.x][current.y-1];
      case "D":
        return map.grid[current.x][current.y+1];
      case "R":
        return map.grid[current.x+1][current.y];
      case "L":
        return map.grid[current.x-1][current.y];
      default:
        throw "Unexpected command : "+command;
    }
  }

  function executeCommands(e) {
    var content = $('#commands').val();
    content = content.toUpperCase().replace(/[^UDRL]/g, "");
    $('#commands').val(content);
    var path = [start];
    var current = start;
    rebuildMap(gridSize);
    map.vis[current.x][current.y] = true;
    for(i = 0; i < content.length; i++) {
      var stuck = false;
      while (!stuck) {
        var next = getNext(map, current, content[i]);
        switch(next.type) {
          case "grass":
            if (map.vis[next.x][next.y]) {
              stuck = true;
            } else {
              path.push(next);
              current = next;
              map.x = current.x;
              map.y = current.y;
              map.vis[current.x][current.y] = true;
            }
            break;
          case "rock":
            // stay at the same place
            stuck = true;
            break;
          case "lava":
            drawMowerHistory(groups, scales, path);
            alert("The mower turned into ashes, as predicted.", "Start again.");
            $('#commands').val("");
            drawMowerHistory(groups, scales, [start]);
            return;
          default:
            throw "Unexpected terrain type "+next.type;
        }
      }
    }
    drawMowerHistory(groups, scales, path);
    if (path.length == map['grass'].length) {
      alert("You win!", "Good job!");
      return;
    }
    var ways = 0;
    var nextDir = 'X';
    var direction = ['L', 'U', 'R', 'D'];
    for (var d = 0; d < 4; d++) {
      var ch = direction[d];
      var next = getNext(map, map, ch);
      if (next.type == 'rock') {
        continue;
      } else if (next.type == 'grass') {
        if (map.vis[next.x][next.y]) {
          continue;
        }
      }
      ways++;
      nextDir = ch;
    }
    var deadEnd = ways == 0;
    if (deadEnd) {
      alert("You entered a deadend!", "Start again.");
      $('#commands').val("");
      rebuildMap(gridSize);
      drawMowerHistory(groups, scales, [start]);
    }
    if (ways == 1) {
      var commands = $('#commands').val();
      $('#commands').val(commands + nextDir);
      executeCommands();
    }
  }

  var squareLength = 40;
  var circleRadius = 15;
  // var ratios = { rock:0.05, lava:0.05 };
  var ratios = { rock:0.05, lava:0 };
  var gridSize = { x:9, y:7 };
  var map = buildMap(gridSize, ratios);
  if (window.location.search != "") {
    gridSize = { x: parseInt(getUrlParameter('width')), y: parseInt(getUrlParameter('height')) }
    var mapString = getUrlParameter('map');
    map = buildMapFromString(mapString);
  }
  var svgSize = getSvgSize(gridSize, squareLength);
  var start = pickRandomPosition(map);
  if (window.location.search != "") {
    start = { x: parseInt(getUrlParameter('x')) + 1, y: parseInt(getUrlParameter('y')) + 1, type: "grass" };
  }
  // alert(start.x);
  // alert(start.y);
  // var map = buildMap(gridSize, ratios);
  // var map = buildMapFromString("..........X........X...X....X.....XX.X..X..XX.X................");
  // console.log(map.rock);
  // var start = pickRandomPosition(map);
  // var start = {x: 3, y: 4};
  map.x = start.x;
  map.y = start.y;
  var svgContainer = d3.select(".display")
                            .append("svg")
                            .attr("width", svgSize.width)
                            .attr("height", svgSize.height);
  var scales = getScale(gridSize, svgSize);

  drawCells(svgContainer, scales, map.grass, "grass");
  drawCells(svgContainer, scales, map.rock, "rock");
  drawCells(svgContainer, scales, map.lava, "lava");

  var groups = { path:svgContainer.append("g"),
                  position:svgContainer.append("g") };

  window.focus();
  d3.select(window).on("keydown", function() {
    var commands = $('#commands').val();
    var direction = ['L', 'U', 'R', 'D'];
    var nextDir = direction[d3.event.keyCode - 37];
    var next = getNext(map, map, nextDir);
    if (next.type == 'rock') {
      return;
    } else if (next.type == 'grass') {
      if (map.vis[next.x][next.y]) {
        return;
      }
    }
    $('#commands').val(commands + nextDir);
    executeCommands();
  });

  $('#commands').on('input', executeCommands);
  $('#maps').on('input', executeCommands);
  // $('#commands').change(executeCommands);
  drawMowerHistory(groups, scales, [start]);

  $('#commands').focus();
});