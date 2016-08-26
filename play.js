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
    if(level == 1){
      c.font = "bold 30px arial";
      c.fillStyle = "black";
      c.textAlign = "center";
      c.fillText("Move with arrow keys or WASD or ZQSD.", 640, 80);
      c.fillText("Pick and drop cubes with [space]. Restart with R.", 640, 120);
      c.fillText("Collect all coins and reach the flag.", 640, 160);
    }
    if(level == 2){
      c.font = "bold 30px arial";
      c.fillStyle = "black";
      c.textAlign = "center";
      c.fillText("Let's add some mechanisms...", 640, 80);
    }
    
    if(level == 3){
      c.font = "bold 30px arial";
      c.fillStyle = "black";
      c.textAlign = "center";
      //c.fillText("And now, you're thinking with portals!", 640, 80);
      //c.fillText("Use mouse to aim and [left click] / [right click] to shoot.", 640, 120);
    }
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
  
  // Move mario
  // ==========
  
  // If not dead and didn't win
  if(current_mario.state != 3 && !win){
    
    // Idle
    current_mario.state = 0;
    
    // Cancel vx (unless a teleportation occurred or mario not grounded)
    if(
      (
        !current_mario.teleport_idle
        &&
        current_mario.vx < 10
      )
      || current_mario.grounded
    ){
      current_mario.vx = 0;
    }
    
    // Go right
    if(current_mario.right && !current_mario.teleport_idle){
      current_mario.keyright[frame] = true;
      current_mario.vx = walk_speed;
      current_mario.direction = 1;
      
      // Walk animation
      if(current_mario.grounded){
        current_mario.state = 1;
      }
    }
    
    // Go left
    if(current_mario.left && !current_mario.teleport_idle){
      current_mario.keyleft[frame] = true;
      current_mario.vx = -walk_speed;
      current_mario.direction = 0;
      
      // Walk animation
      if(current_mario.grounded){
        current_mario.state = 1;
      } 
    }
    
    // Jump (if not in a portal)
    if(!current_mario.in_portal && current_mario.up && current_mario.grounded && current_mario.can_jump){
      current_mario.keyup[frame] = true;
      current_mario.vy -= jump_speed;
      current_mario.grounded = false;
      current_mario.can_jump = false;
    }
    
    // Jump sprite
    if(current_mario.vy < 0 && !current_mario.grounded){
      current_mario.state = 2;
    }
    
    // Apply gravity and collsions
    //console.log(current_mario.x, current_mario.y);
    gravity_and_collisions(current_mario, mario_width, 0);
    //console.log(current_mario.x, current_mario.y);
    
    // Collect coins (tile 6 => tile 0)
    if(tile_at(current_mario.x + mario_width / 2, current_mario.y + 16) == 6){
      set_tile(current_mario.x + mario_width / 2, current_mario.y + 16, 0);
    }
    
    // Die (spike)
    if(
      tile_at(current_mario.x + 3, current_mario.y) == 7
      ||
      tile_at(current_mario.x + mario_width - 3, current_mario.y) == 7
      ||
      tile_at(current_mario.x + 3, current_mario.y + 5) == 7
      ||
      tile_at(current_mario.x + mario_width - 3, current_mario.y + 5) == 7
    ){
      current_mario.state = 3;
      current_mario.vy = -1.5 * jump_speed;
    }
    
    // Die (fall)
    if(current_mario.y > 648){
      current_mario.state = 3;
      current_mario.vy = -1.5 * jump_speed;
    }
    
    // Pick cube
    if(current_mario.space){
      current_mario.keyspace[frame] = true;
      if(current_mario.cube_held === null){
        for(i in level_data.cubes){
          if(
            current_mario.x + mario_width >= level_data.cubes[i].x
            &&
            current_mario.x <= level_data.cubes[i].x + 31
            &&
            current_mario.y + 31 >= level_data.cubes[i].y
            &&
            current_mario.y <= level_data.cubes[i].y + 31
          ){
            current_mario.cube_held = i;
            level_data.cubes[i].mario = current_mario;
            current_mario.pick_cube_animation_frame = 5;
            break;
          }
        }
      }
    }
    
    // Drop cube
    else {
      if(level_data.cubes[current_mario.cube_held]){
        
        // Drop ahead of mario (todo)
        //level_data.cubes[current_mario.cube_held].x = current_mario.x + (current_mario.direction == 1 ? 1 : -1) * 16;
        //if(is_solid(tile_at( ~~((level_data.cubes[current_mario.cube_held].x + 32) / 32), level_data.cubes[current_mario.cube_held].y))){
        //  level_data.cubes[current_mario.cube_held].x = current_mario.x;
        //}        
        level_data.cubes[current_mario.cube_held].mario = null;
        current_mario.cube_held = null;
        current_mario.weight = 1;
      }
    }
    
    // Hold cube
    if(current_mario.cube_held !== null){
      level_data.cubes[current_mario.cube_held].x = current_mario.x + (current_mario.direction * -1) * 8;
      
      // Animate cube grab (make it last 5 frames)
      if(current_mario.pick_cube_animation_frame){
        current_mario.pick_cube_animation_frame--;
      }
      
      // Place cube over Mario
      level_data.cubes[current_mario.cube_held].y = current_mario.y - 32 + current_mario.pick_cube_animation_frame * 4;
    }
    
    // If no cube is held, cancel space key
    else {
      current_mario.space = 0;
    }
    
    // Win (all coins gathered and touch flag)
    if(tile_at(current_mario.x + mario_width / 2, current_mario.y + 16) == 2 || tile_at(current_mario.x + mario_width / 2, current_mario.y + 16) == 24){
      coins_left = 0;
      for(j = 0; j < 20; j++){
        for(i = 0; i < 40; i++){
          if(level_data.tiles[j][i] == 6){
           coins_left++;
          }
        }
      }
      if(coins_left == 0){
        win = true;
        current_mario.state = 0;
      }
    }
    
    // Shoot blue portal
    if(current_mario.shoot_blue){
      for(i = 0; i < 40; i++){
        current_mario.shoot_blue += .001;
        current_mario.portal_shoot_x += current_mario.shoot_blue * current_mario.portal_shoot_vx;
        current_mario.portal_shoot_y += current_mario.shoot_blue * current_mario.portal_shoot_vy;
        if(is_solid(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y))){
          current_mario.shoot_blue = 0;
          
          // Define on which side the portal goes (0: top, 1: right, 2: bottom, 3: left)
          // Avoid opening a portal between two solid tiles, and on sides not reachable given the current angle
          if(current_mario.portal_shoot_x % 32 < 4 && !is_solid(tile_at(current_mario.portal_shoot_x - 32, current_mario.portal_shoot_y)) && current_mario.portal_shoot_vx > 0){
            temp_side = 3;
          }
          if(current_mario.portal_shoot_x % 32 > 28 && !is_solid(tile_at(current_mario.portal_shoot_x + 32, current_mario.portal_shoot_y)) && current_mario.portal_shoot_vx < 0){
            temp_side = 1;
          }
          if(current_mario.portal_shoot_y % 32 < 4 && !is_solid(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y - 32)) && current_mario.portal_shoot_vy > 0){
            temp_side = 0;
          }
          if(current_mario.portal_shoot_y % 32 > 28 && !is_solid(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y + 32)) && current_mario.portal_shoot_vy < 0){
            temp_side = 2;
          }

          // Place portal if tile is #4 and no orange portal is here yet
          if(
            tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y) == 4
            &&
            (~~(current_mario.portal_shoot_x / 32) != orange_portal.tile_x || ~~(current_mario.portal_shoot_y / 32) != orange_portal.tile_y || orange_portal != temp_side)
          ){
            blue_portal.tile_x = ~~(current_mario.portal_shoot_x / 32);
            blue_portal.tile_y = ~~(current_mario.portal_shoot_y / 32);
            blue_portal.side = temp_side;
          }
        }
        else{
          c.fillStyle = "blue";
          c.fillRect(current_mario.portal_shoot_x, current_mario.portal_shoot_y + 40, 6, 6);        
        }
      }
    }
    
    // Shoot orange portal
    if(current_mario.shoot_orange){
      for(i = 0; i < 40; i++){
        current_mario.shoot_orange += .001;
        current_mario.portal_shoot_x += current_mario.shoot_orange * current_mario.portal_shoot_vx;
        current_mario.portal_shoot_y += current_mario.shoot_orange * current_mario.portal_shoot_vy;
        if(is_solid(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y))){
          current_mario.shoot_orange = 0;
          
          // Define on which side the portal goes (0: top, 1: right, 2: bottom, 3: left)
          // Avoid opening a portal between two solid tiles, and on sides not reachable given the current angle
          if(current_mario.portal_shoot_x % 32 < 4 && !is_solid(tile_at(current_mario.portal_shoot_x - 32, current_mario.portal_shoot_y)) && current_mario.portal_shoot_vx > 0){
            temp_side = 3;
          }
          if(current_mario.portal_shoot_x % 32 > 28 && !is_solid(tile_at(current_mario.portal_shoot_x + 32, current_mario.portal_shoot_y)) && current_mario.portal_shoot_vx < 0){
            temp_side = 1;
          }
          if(current_mario.portal_shoot_y % 32 < 4 && !is_solid(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y - 32)) && current_mario.portal_shoot_vy > 0){
            temp_side = 0;
          }
          if(current_mario.portal_shoot_y % 32 > 28 && !is_solid(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y + 32)) && current_mario.portal_shoot_vy < 0){
            temp_side = 2;
          }

          // Place portal if tile is #4 and no orange portal is here yet
          if(
            tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y) == 4
            &&
            (~~(current_mario.portal_shoot_x / 32) != orange_portal.tile_x || ~~(current_mario.portal_shoot_y / 32) != orange_portal.tile_y || orange_portal != temp_side)
          ){
            orange_portal.tile_x = ~~(current_mario.portal_shoot_x / 32);
            orange_portal.tile_y = ~~(current_mario.portal_shoot_y / 32);
            orange_portal.side = temp_side;
          }
        }
        else{
          c.fillStyle = "orange";
          c.fillRect(current_mario.portal_shoot_x, current_mario.portal_shoot_y + 40, 6, 6);        
        }
      }
    }
    
    // If hero is not in a #4 solid tile, assume he's not in a portal
    if(
      tile_at(current_mario.x + 1, current_mario.y + 1) != 4
      &&
      tile_at(current_mario.x + mario_width - 1, current_mario.y + 1) != 4
      &&
      tile_at(current_mario.x + 1, current_mario.y + 31) != 4
      &&
      tile_at(current_mario.x + + mario_width - 1, current_mario.y + 31) != 4
    ){
      current_mario.in_portal = false;
    }
    
    // Decrement teleportation idle delay
    if(current_mario.teleport_idle){
      current_mario.teleport_idle--;
    }
  }
  
  // Death animation
  if(current_mario.state == 3){
    current_mario.vy += gravity;
    if(current_mario.vy > max_fall_speed){
      current_mario.vy = max_fall_speed;
    }
    current_mario.y += current_mario.vy;
  }
  
  // Move cubes
  // =====
  
  for(i in level_data.cubes){
    
    // Apply gravity and collsions if the cube is not held
    if(level_data.cubes[i].mario === null){
      level_data.cubes[i].vx = 0;
      gravity_and_collisions(level_data.cubes[i], 32, 1);
    }
  }
  
  // Draw cubes
  for(i in level_data.cubes){
    c.drawImage(tileset, 12 * 16, 0, 16, 16, level_data.cubes[i].x, 40 + level_data.cubes[i].y, 32, 32);
  }
  
  // Draw Mario (facing right)
  if(current_mario.direction == 1){
    c.drawImage(tileset, [26, [27,28,29][~~(frame / 2) % 3], 30, 31][current_mario.state] * 16, 0, 16, 16, current_mario.x - 4, 40 + current_mario.y, 32, 32);
  }
  
  // Draw Mario (facing left)
  else{
    c.save();
    c.translate(current_mario.x + mario_width + 4, current_mario.y);
    c.scale(-1,1);
    c.drawImage(tileset, [26, [27,28,29][~~(frame / 2) % 3], 30, 31][current_mario.state] * 16, 0, 16, 16, 0, 40, 32, 32);
    c.restore();
  }
  
  // Draw portal tiles and portals in front of hero
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
    
    // More weight on side 1
    if(balances_state[i].weight1 > balances_state[i].weight2){
      balances_state[i].y1 += 4;
      balances_state[i].y2 -= 4;
    }
    
    // More weight on side 2
    else if(balances_state[i].weight2 > balances_state[i].weight1){
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
  document.title = current_mario.x + " " + current_mario.y;
  
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
