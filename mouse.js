// Handle clicks on the canvas on each screen
a.onclick = a.oncontextmenu = (e) => {

  // Offsets
  x = e.pageX - a.getBoundingClientRect().left - document.documentElement.scrollLeft - document.body.scrollLeft;
  y = e.pageY - a.getBoundingClientRect().top - document.documentElement.scrollTop - document.body.scrollTop;

  // Main menu
  // =========
  
  if(screen == 0){

    // Button 1 (play): display level selection screen
    c.beginPath();
    c.rect(500, 400, 100, 80);
    if(c.isPointInPath(x, y)){
      screen = 1;
      draw_screen();
    }
    c.closePath();
    
    // Button 2 (make): redirect to level editor
    c.beginPath();
    c.rect(650, 400, 100, 80);
    if(c.isPointInPath(x, y)){
      screen = 3;
      reset_maker_level();
      draw_screen();
    }
    c.closePath();
  }
  
  // Level selection menu
  // ====================
  
  if(screen == 1){
    
    // Back button
    c.beginPath();
    c.rect(30, 30, 50, 50);
    if(c.isPointInPath(x, y)){
      screen = 0;
      draw_screen();
    }
    c.closePath();
    
    // Shared levels
    c.beginPath();
    c.rect(590, 520, 100, 80);
    if(c.isPointInPath(x, y)){
      location = "todo";
    }
    c.closePath();
    
    // Levels
    for(i = 0; i < 10; i++){
      for(j = 0; j < 3; j++){
        number = j * 10 + i + 1;
        if(+localStorage["scpm_level"] >= number){
          c.beginPath();
          c.rect(i * 120 + 50, j * 100 + 120, 100, 80);
          if(c.isPointInPath(x, y)){
            last_screen = 1;
            screen = 2;
            level = number;
            level_data = levels[number];
            draw_screen();
          }
          c.closePath();
        }
      }
    }
  }
  
  // In-game
  // =======
  if(screen == 2 && frame > 0){
    
    // Left click: current mario sends a blue portal
    if(e.which == 1){
      current_mario.shoot_blue = 1;
    } 
    if(e.which == 3){
      current_mario.shoot_orange = 1;
    }
    
    c.beginPath();
    
    // Compute the angle made by the line "Mario - click coordinates" and the horizontal axis
    var angle = Math.atan2(x - (current_mario.x + mario_width / 2), y - (current_mario.y + 40 + 16));
    current_mario.portal_shoot_x = current_mario.x + mario_width / 2;
    current_mario.portal_shoot_y = current_mario.y + 16;
    current_mario.portal_shoot_vx = Math.sin(angle);
    current_mario.portal_shoot_vy = Math.cos(angle);
    
    c.stroke();
    c.closePath();
    
    // Quit
    c.beginPath();
    c.rect(1240, 0, 32, 32);
    if(c.isPointInPath(x, y)){
      clearInterval(loop);
      screen = last_screen;
      draw_screen();
    }
    c.closePath();
    
    
  }
  
  // Level editor
  // ===============
  if(screen == 3){
  
    // Test
    c.beginPath();
    c.rect(750, 4, 100, 32);
    if(c.isPointInPath(x, y)){
      
      level_data.hash = "";
      for(j = 0; j < 20; j++){
        for(i = 0; i < 40; i++){
          tile = level_data.tiles[j][i] || 0;
          tile = (tile < 16 || tile > 21) ? tile : 0;
          level_data.hash += String.fromCharCode(tile + 0x30);
        }
      }
      last_screen = 3;
      screen = 2;
      draw_screen();
    }
    c.closePath();
    
    // Share
    c.beginPath();
    c.rect(875, 4, 100, 32);
    if(c.isPointInPath(x, y)){
      
      level_data.hash = "";
      for(j = 0; j < 20; j++){
        for(i = 0; i < 40; i++){
          tile = level_data.tiles[j][i] || 0;
          tile = (tile < 16 || tile > 21) ? tile : 0;
          level_data.hash += String.fromCharCode(tile + 0x30);
        }
      }
      
      location.hash = "";
        
      if(level_data.tested == false){
        alert("You need to test and win your level first.");
        
        // TMP
        prompt("Here's your level URL:", encodeURI(location.origin + location.pathname + "#" + JSON.stringify({hash:level_data.hash, pipes:level_data.pipes, balances: level_data.balances})));
        prompt("Here's your level URL:", location.origin + location.pathname + "#" + JSON.stringify({hash:level_data.hash, pipes:level_data.pipes, balances: level_data.balances}));
      }
      
      else {
        prompt("Here's your level URL:", encodeURI(location.origin + location.pathname + "#" + JSON.stringify({hash:level_data.hash, pipes:level_data.pipes, balances: level_data.balances})));
        prompt("Here's your level URL:", location.origin + location.pathname + "#" + JSON.stringify({hash:level_data.hash, pipes:level_data.pipes, balances: level_data.balances}));
      }
    }
    c.closePath();
    
    // Clear
    c.beginPath();
    c.rect(1000, 4, 100, 32);
    if(c.isPointInPath(x, y)){
      reset_maker_level();
      draw_screen();
    }
    c.closePath();
    
    // Exit
    c.beginPath();
    c.rect(1125, 4, 100, 32);
    if(c.isPointInPath(x, y)){
      screen = 0;
      draw_screen();
    }
    c.closePath();
    
    // Tileset (choose a tile), unless we're placing a pipe or a balance
    for(i = 0; i < 16; i++){
      c.beginPath();
      c.rect(8.5 + i * 35, 3.5, 32, 32);
      if(c.isPointInPath(x, y) && pipe_click == 0 && balance_click == 0){
        current_editor_tile = i;
        
        // Pipe: init a pipe object
        if(current_editor_tile == 14){
          level_data.pipes[current_pipe] = [];
        }
        
        // Balance: init a balance object
        if(current_editor_tile == 15){
          level_data.balances[current_balance] = [];
        }
        
        draw_screen();
      }
      c.closePath();
    }
    
    // Grid (place a tile)
    c.beginPath();
    c.rect(8.5, 40.5, 1264, 592);
    if(c.isPointInPath(x, y)){
      
      // Mark the level as untested
      level_data.tested = false;
      
      // Compute click coordinates
      tile_x = Math.floor(x / 32);
      tile_y = Math.floor((y - 40) / 32);
      
      // Draw tiles
      
      // Special cases:
      
      // Right click
      if(rightclick == true){
        
        // If the tile is writable
        if(is_writable(tile_x, tile_y)){
          level_data.tiles[tile_y][tile_x] = 0;
        }
      }
      
      else{
      
        // Tile #1: only one time machine, below line 1
        if(current_editor_tile == 1){
          
          // If the two tiles are writable
          if(tile_y > 0 && is_writable(tile_x, tile_y) && is_writable(tile_x, tile_y - 1)){
            for(j in level_data.tiles){
              for(i in level_data.tiles[j]){
                if(level_data.tiles[j][i] == 22 || level_data.tiles[j][i] == 23){
                  level_data.tiles[j][i] = 0;
                }
              }
            }
            level_data.tiles[tile_y - 1][tile_x] = 22;
            level_data.tiles[tile_y][tile_x] = 23;
          }
        }
        
        // Tile #2: only one flag
        else if(current_editor_tile == 2){
          
          // If the tile is writable
          if(is_writable(tile_x, tile_y)){
          
            for(j in level_data.tiles){
              for(i in level_data.tiles[j]){
                if(level_data.tiles[j][i] == 2){
                  level_data.tiles[j][i] = 0;
                }
              }
            }
            level_data.tiles[tile_y][tile_x] = 2;
          }
        }
        
        // Tile #14: pipe
        else if(current_editor_tile == 14){
          
          // If the two tiles are writable
          if(is_writable(tile_x, tile_y) && is_writable(tile_x + 1, tile_y)){
            
            // 1st click: set position 1 (x, y)
            if(pipe_click == 0){
              level_data.pipes[current_pipe] = [];
              level_data.pipes[current_pipe][0] = tile_x;
              level_data.pipes[current_pipe][1] = tile_y;
              level_data.tiles[tile_y][tile_x] = 16;
              level_data.tiles[tile_y][tile_x + 1] = 17;
              pipe_click ++;
            }
            
            // 2nd click: test if in-between tiles are writable and set position 2 (y)
            else if(pipe_click == 1){
              
              if(true){ // todo
                level_data.pipes[current_pipe][2] = tile_y;
                level_data.tiles[tile_y][level_data.pipes[current_pipe][0]] = 16;
                level_data.tiles[tile_y][level_data.pipes[current_pipe][0] + 1] = 17;
                pipe_click ++;
              }
            }
            
            // 3rd click: set switch position (x, y)
            else if(pipe_click == 2){
              level_data.pipes[current_pipe][3] = tile_x;
              level_data.pipes[current_pipe][4] = tile_y;
              level_data.tiles[tile_y][tile_x] = 20;
              current_pipe++;
              pipe_click = 0;
            }
          }
        }
        
        // Tile #15: balanced platforms
        else if(current_editor_tile == 15){
          
          // If the three tiles are writable
          if(is_writable(tile_x - 1, tile_y) && is_writable(tile_x, tile_y) && is_writable(tile_x + 1, tile_y)){
            
            // 1st click: platform 1 (x, y)
            if(balance_click == 0){
              level_data.balances[current_balance] = [];
              level_data.balances[current_balance][0] = tile_x;
              level_data.balances[current_balance][1] = tile_y;
              balance_click++
            }
            
            // 2nd click: set position 2 (x, y)
            else if(balance_click == 1){
              level_data.balances[current_balance][2] = tile_x;
              level_data.balances[current_balance][3] = tile_y;
              current_balance++;
              balance_click = 0;
            }
            
            level_data.tiles[tile_y][tile_x - 1] = 15;
            level_data.tiles[tile_y][tile_x] = 15;
            level_data.tiles[tile_y][tile_x + 1] = 15;
          }
        }
        
        // Normal case:
        
        // Save current tile
        else if(is_writable(tile_x, tile_y)){
          level_data.tiles[tile_y][tile_x] = current_editor_tile;
        }      
      }
      
      draw_screen();
    }
    c.closePath();
  }
  
  return false;
}

// On mouse down, set a mousedown flag and a rightclick flag (if right click is down)
onmousedown = (e) => {
  mousedown = true;
  if(e.which == 3){
    rightclick = true;
  }
  else{
    rightclick = false;
  }
}

// On mouse up, reset the mousedown flag
onmouseup = () => {
  mousedown = false;
}

// On mouse move:
onmousemove = (e) => {
  
  // Level editor only
  if(screen == 3){
    
    // Consider mousedown + mousemove like clicks (unless we're placing a pipe or a balance)
    if(mousedown && current_editor_tile != 14 && current_editor_tile != 15){
      onclick(e);
    }
    
    // Save mouse tile coordinates
    x = e.pageX - a.getBoundingClientRect().left - document.documentElement.scrollLeft - document.body.scrollLeft;
    y = e.pageY - a.getBoundingClientRect().top - document.documentElement.scrollTop - document.body.scrollTop;
    tile_x = Math.floor(x / 32);
    tile_y = Math.floor((y - 40) / 32);
    draw_screen();
  }
}
