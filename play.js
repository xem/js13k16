// Game loop
var play = () => {

  // Reset canvas
  a.width ^= 0;
  
  // Draw exit button
  c.font = "bold 30px arial";
  c.fillStyle = "#000";
  c.fillText("×", 1255, 25);
  
  // First levels: add text
  if(last_screen == 1){
    c.font = "bold 30px arial";
    c.fillStyle = "black";
    c.textAlign = "center";
    
    if(level == 1){
      c.fillText("Move with arrow keys or WASD or ZQSD.", 640, 80);
      c.fillText("Pick and drop cubes with [space]. Restart with R.", 640, 120);
      c.fillText("Collect all coins and reach the flag.", 640, 160);
    }
    
    if(level == 2){
      c.fillText("Let's add some mechanisms...", 640, 80);
    }
    
    if(level == 3){
      c.fillText("And now, you're thinking with portals!", 640, 80);
      c.fillText("Use mouse to aim and [left click] / [right click] to shoot.", 640, 120);
    }
    
    if(level == 4){
      c.fillText("Don't forget the momentum!", 640, 120);
    }
  }
  
  // Save keys being pressed (for latest hero only)
  if(current_mario.keyleft){
    current_mario.left[frame] = true;
  }
  if(current_mario.keyright){
    current_mario.right[frame] = true;
  }
  if(current_mario.keyup){
    current_mario.up[frame] = true;
  }
  
  // Pixelize graphics
  c.mozImageSmoothingEnabled = false;
  c.imageSmoothingEnabled = false;
  
  // On first frame:
  // ---------------
  if(frame == 0){
    
    // Init states of pipes, cubes, balances...
    first_frame();
  }
  
  // Then, at each frame:
  // --------------------
  
  // Move and draw pipes
  move_draw_pipes();
  
  // Draw map
  parse_draw_map();
  
  // Reset all mechanisms
  reset_mechanisms();
  
  // Replay previous heros inputs
  for(h in heros){
    
    // TODO
    
  }
  
  // Play current hero
  
  play_hero(current_mario);
  
  // Move cubes
  // =====
  
  for(i in level_data.cubes){
    
    // If cube is not in a #4 solid tile, assume it's not in a portal
    if(
      tile_at(level_data.cubes[i].x + 1, level_data.cubes[i].y + 1) != 4
      &&
      tile_at(level_data.cubes[i].x + 32 - 1, level_data.cubes[i].y + 1) != 4
      &&
      tile_at(level_data.cubes[i].x + 1, level_data.cubes[i].y + 31) != 4
      &&
      tile_at(level_data.cubes[i].x + + 32 - 1, level_data.cubes[i].y + 31) != 4
    ){
      level_data.cubes[i].in_portal = false;
    }
    
    // Decrement teleportation idle delay
    if(level_data.cubes[i].teleport_idle){
      level_data.cubes[i].teleport_idle--;
    }  
    
    // Apply gravity and collsions if the cube is not held
    if(level_data.cubes[i].mario === null){
      level_data.cubes[i].vx = 0;
      gravity_and_collisions(level_data.cubes[i], 32, 1);
    }
  }
  
  // Draw
  // ====

  // Draw cubes
  for(i in level_data.cubes){
    c.drawImage(tileset, 12 * 16, 0, 16, 16, level_data.cubes[i].x, 40 + level_data.cubes[i].y, 32, 32);
  }
    
  // Draw previous heros
  for(hero in heros){
    
    // TODO
    
  }
  
  // Draw current hero
  draw_hero(current_mario);
  
  // Draw portal tiles and portals in foreground
  draw_tile(4, blue_portal.tile_x, blue_portal.tile_y);
  draw_tile(4, orange_portal.tile_x, orange_portal.tile_y);
  c.fillStyle = "blue";
  
  if(blue_portal.side == 0){
    c.fillRect(blue_portal.tile_x * 32, blue_portal.tile_y * 32 + 40 - 8, 32, 8);
  }
  if(blue_portal.side == 1){
    c.fillRect(blue_portal.tile_x * 32 + 28, blue_portal.tile_y * 32 + 40, 8, 32);
  }
  if(blue_portal.side == 2){
    c.fillRect(blue_portal.tile_x * 32, blue_portal.tile_y * 32 + 40 + 28, 32, 8);
  }
  if(blue_portal.side == 3){
    c.fillRect(blue_portal.tile_x * 32 - 4, blue_portal.tile_y * 32 + 40, 8, 32);
  }
  c.fillStyle = "orange";
  
  if(orange_portal.side == 0){
    c.fillRect(orange_portal.tile_x * 32, orange_portal.tile_y * 32 + 40 - 8, 32, 8);
  }
  if(orange_portal.side == 1){
    c.fillRect(orange_portal.tile_x * 32 + 28, orange_portal.tile_y * 32 + 40, 8, 32);
  }
  if(orange_portal.side == 2){
    c.fillRect(orange_portal.tile_x * 32, orange_portal.tile_y * 32 + 40 + 28, 32, 8);
  }
  if(orange_portal.side == 3){
    c.fillRect(orange_portal.tile_x * 32 - 4, orange_portal.tile_y * 32 + 40, 8, 32);
  }
  
  // Mechanisms
  // ==========
  
  // Apply yellow toggle (invert plain and transparent tiles if yellow toggle has changed during this frame)
  if(yellow_toggle != yellow_toggle_last_frame){
    for(j = 0; j < 20; j++){
      for(i = 0; i < 40; i++){
        if(level_data.tiles[j][i] == 9){
          level_data.tiles[j][i] = 10;
        }
        else if(level_data.tiles[j][i] == 10){
          level_data.tiles[j][i] = 9;
        }
      }
    }
  }
  
  // Save yellow toggle state 
  yellow_toggle_last_frame = yellow_toggle;
  
  // Balances
  for(i in level_data.balances){
    
    // More weight on side 1 and no solid tile under platform 1 and no solid tile over platform 2
    if(
      balances_state[i].weight1 > balances_state[i].weight2
      && !is_solid(tile_at(level_data.balances[i][0] * 32 - 32, balances_state[i].y1 + 20))
      && !is_solid(tile_at(level_data.balances[i][0] * 32, balances_state[i].y1 + 20))
      && !is_solid(tile_at(level_data.balances[i][0] * 32 + 32, balances_state[i].y1 + 20))
      && !is_solid(tile_at(level_data.balances[i][2] * 32 - 32, balances_state[i].y2 - 4))
      && !is_solid(tile_at(level_data.balances[i][2] * 32 - 32, balances_state[i].y2 - 4))
      && !is_solid(tile_at(level_data.balances[i][2] * 32 - 32, balances_state[i].y2 - 4))
    ){
      balances_state[i].y1 += 4;
      balances_state[i].y2 -= 4;
    }
    
    // More weight on side 2 and no solid tile under platform 2 and no solid tile over platform 1
    else if(
      balances_state[i].weight2 > balances_state[i].weight1
      && !is_solid(tile_at(level_data.balances[i][2] * 32 - 32, balances_state[i].y2 + 20))
      && !is_solid(tile_at(level_data.balances[i][2] * 32, balances_state[i].y2 + 20))
      && !is_solid(tile_at(level_data.balances[i][2] * 32 + 32, balances_state[i].y2 + 20))
      && !is_solid(tile_at(level_data.balances[i][0] * 32 - 32, balances_state[i].y1 - 4))
      && !is_solid(tile_at(level_data.balances[i][0] * 32 - 32, balances_state[i].y1 - 4))
      && !is_solid(tile_at(level_data.balances[i][0] * 32 - 32, balances_state[i].y1 - 4))
    ){
      balances_state[i].y1 -= 4;
      balances_state[i].y2 += 4;
    }
    
    // Draw balance 1
    draw_sprite(15, level_data.balances[i][0] * 32 - 32, balances_state[i].y1 + 40);
    draw_sprite(15, level_data.balances[i][0] * 32, balances_state[i].y1 + 40);
    draw_sprite(15, level_data.balances[i][0] * 32 + 32, balances_state[i].y1 + 40);
    
    // Draw balance 2
    draw_sprite(15, level_data.balances[i][2] * 32 - 32, balances_state[i].y2 + 40);
    draw_sprite(15, level_data.balances[i][2] * 32, balances_state[i].y2 + 40);
    draw_sprite(15, level_data.balances[i][2] * 32 + 32, balances_state[i].y2 + 40);
  }
  
  // Next frame
  frame++;
  
  //document.title = frame + " " + current_mario.weight + " " + balances_state[0].weight1 + " " + balances_state[0].weight2 + " " + level_data.cubes[1].weight;
  //document.title = current_mario.x + " " + current_mario.y;
  
  // Win animation
  if(win){
    win_frame++;
    c.font = "bold 100px arial";
    c.fillStyle = "#000";
    c.textAlign = "center";
    c.fillText("CLEARED!", 640, 350)
  }
  if(win_frame >= 30){
    a.width ^= 0;
    clearInterval(loop);
    screen = last_screen;
    level_data.tested = true;
    a.width ^= 0;
    draw_screen();
  }
}
