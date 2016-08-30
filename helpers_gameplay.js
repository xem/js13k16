// Functions used by the game loop (play)

// OK

// First frame inits (also happen after time travels)
var first_frame = function(){
  
  // Build map from hash
  level_data.tiles = [];
  for(var j = 0; j < 20; j++){
    level_data.tiles[j] = [];
    for(var i = 0; i < 40; i++){
      
      level_data.tiles[j][i] = level_data.hash.charCodeAt(j * 40 + i) - 0x30;

      // Ignore tile #15 / "?" / balanced platforms placeholders.
      if(level_data.tiles[j][i] == 15){
        level_data.tiles[j][i] = 0
      }
    }
  }
  
  // Init pipes states
  for(var i in level_data.pipes){
    pipes_state[i] = {pressed: false, y: level_data.pipes[i][1] * 32};
  }
  
  // Init balances states (on first frame)
  for(var i in level_data.balances){
    balances_state[i] = {y1: level_data.balances[i][1] * 32 , y2: level_data.balances[i][3] * 32, weight1: 0, weight2: 0};
  }
}

// OK

// Move and draw pipes (at each frame)
var move_draw_pipes = function(){
  
  // For each pipe
  for(var i in level_data.pipes){
    
    // Go to position 2 when switch is pressed
    if(pipes_state[i].pressed){
      target = level_data.pipes[i][2] * 32;
    }
    
    // Go to position 1 when switch is not pressed
    else {
      target = level_data.pipes[i][1] * 32;
    }
      
    // Go up
    if(pipes_state[i].y > target){
      pipes_state[i].y = Math.max(pipes_state[i].y - 4, target);
    }
    
    // Go down
    else if(pipes_state[i].y < target){
      pipes_state[i].y = Math.min(pipes_state[i].y + 4, target);
    }

    // Draw pipe body (tiles #18 / #19)
    end_pipe = false;
    for(var k = ~~(pipes_state[i].y / 32) + 1; k < 21; k++){
      if(k < 20 && !is_solid(tile_at(level_data.pipes[i][0],k)) && !is_solid(tile_at(level_data.pipes[i][0] + 1, k)) && !end_pipe){
        draw_tile(18, level_data.pipes[i][0], k);
        draw_tile(19, level_data.pipes[i][0] + 1, k);
      }
      else{
        end_pipe = true;
        pipes_state[i].y_base = k * 32;
        break;
      }
    }
    
    // Draw pipe top (tiles #16 / #17)
    draw_sprite(16, level_data.pipes[i][0] * 32, pipes_state[i].y + 40);
    draw_sprite(17, level_data.pipes[i][0] * 32 + 32, pipes_state[i].y + 40);
    
    // Draw switch
    if(level_data.pipes[i][4]){
      
      if(pipes_state[i].pressed){
        draw_tile(21, level_data.pipes[i][3], level_data.pipes[i][4]);
      }
      else{
        draw_tile(20, level_data.pipes[i][3], level_data.pipes[i][4]);
      }
    }
  }
}

// OK

// Parse and draw map (at each frame, but if we're on frame 0, also set start coordinates, initialize cubes and build flag pole)
var parse_draw_map = function(){
  for(j = 0; j < 20; j++){
    for(i = 0; i < 40; i++){
      
      // Current tile
      drawn_tile = level_data.tiles[j][i];
      
      // Tile #12: cube (register it in level_data.cubes and remove it from the tiles)
      if(drawn_tile == 12){
        drawn_tile = 0;
        if(frame == 0){
          level_data.cubes.push({x: i * 32, y: j * 32, vy: 0, mario: null});
        }
      }
      
      draw_tile(drawn_tile, i, j);

      // Tile #2: flag pole (make it touch the ground)
      if(drawn_tile == 2 && frame == 0){
        end_pole = false;
        if(j < 20){
          for(k = j + 1; k < 20; k++){
            if(!level_data.tiles[k][i] && !end_pole){
              draw_tile(24, i, k);
              level_data.tiles[k][i] = 24;
            }
            else{
              end_pole = true;
            }
          }
        }
      }
      
      // Tile #23: time machine (save starting point coordinates, place Mario there at first frame)
      if(drawn_tile == 23 && frame == 0){
        level_data.start = [i, j];
        current_mario.x = level_data.start[0] * 32;
        current_mario.y = level_data.start[1] * 32;
      }
    }
  }
}

// OK

// Reset green buttons, yellow buttons and balances/cubes/heros weights (at each frame, before everything is re-computed)
var reset_mechanisms = function(){
  
  // Reset yellow buttons
  yellow_toggle = false;
  for(j = 0; j < 20; j++){
    for(i = 0; i < 40; i++){
      if(level_data.tiles[j][i] == 25){
        level_data.tiles[j][i] = 11;
      }
    }
  }
  
  // Reset green buttons
  for(i in level_data.pipes){
    pipes_state[i].pressed = false;
  }
  
  // Reset weights of heros, cubes and balances
  for(hero in heros){
    
    // TODO
  
  }
  
  current_mario.weight = 1;
  
  for(i in level_data.cubes){
    level_data.cubes[i].weight = 1;
  }
  
  for(i in level_data.balances){
    balances_state[i].weight1 = 0;
    balances_state[i].weight2 = 0;
  }
}

// Apply gravity and collisions to a given object (type 0: mario, type 1: cube), plus make it enter in portals
var gravity_and_collisions = function(obj, obj_width, type){
  
  // compute object's weight
  if(typeof obj.cube_held != "undefined" && obj.cube_held !== null){
    obj.weight = 1 + level_data.cubes[obj.cube_held].weight;
  }

  // Go right
  if(obj.vx > 0){
    
    obj.portal_target = null;
    
    // Enter a portal on the right (tile 4 + portal on position 3 (left) + other portal exists)
    if(
      tile_at(obj.x + obj_width + obj.vx, obj.y + 16) == 4
      &&
      orange_portal.tile_x >= 0
      &&
      blue_portal.tile_x == ~~((obj.x + obj_width + obj.vx) / 32)
      &&
      blue_portal.tile_y == ~~((obj.y + 16) / 32)
      &&
      blue_portal.side == 3
    ){
      obj.portal_target = orange_portal;
    }
    
    if(
      tile_at(obj.x + obj_width + obj.vx, obj.y + 16) == 4
      &&
      blue_portal.tile_x >= 0
      &&
      orange_portal.tile_x == ~~((obj.x + obj_width + obj.vx) / 32)
      &&
      orange_portal.tile_y == ~~((obj.y + 16) / 32)
      &&
      orange_portal.side == 3
    ){
      obj.portal_target = blue_portal;
    }
    
    // If the object is entering a portal
    if(obj.portal_target){
      
      // Adjust position and speed
      obj.y = ~~((obj.y + 16) / 32) * 32;
      obj.vy = 0;
      obj.in_portal = true;
      
      // Teleport and maintain the speed for a few frames if the object's left side entered the portal's tile
      if(tile_at(obj.x + obj.vx, obj.y + 16) == 4){
        obj.teleport = true;
        obj.momentum = Math.max(obj.vx, walk_speed);
        obj.vx = 0;
        obj.teleport_idle = 8;
      }
    }
    
    // Stop going right if there's a solid tile or the end of the screen on the right
    else if(
      is_solid(tile_at(obj.x + obj_width + obj.vx, obj.y))
      ||
      is_solid(tile_at(obj.x + obj_width + obj.vx, obj.y + 31))
    ){
      obj.x = ~~((obj.x + obj.vx) / 32) * 32 + 32 - obj_width - 1;
      obj.vx = 0;
    }
    
    if(obj.x > 1280 - obj_width){
      obj.x = 1280 - obj_width;
      obj.vx = 0;
    }
    
    // Stop going right if there's a pipe there
    for(var j in level_data.pipes){
      if(
        !obj.in_portal
        &&
        obj.x + obj_width + obj.vx >= level_data.pipes[j][0] * 32
        &&
        obj.x + obj_width + obj.vx  <= level_data.pipes[j][0] * 32 + 16
        &&
        obj.y + 31 >= pipes_state[j].y
        &&
        obj.y <= pipes_state[j].y_base
      ){
        obj.x = level_data.pipes[j][0] * 32 - obj_width - 1;
        obj.vx = 0;
      }
    }
  }
  
  // Go left
  if(obj.vx < 0){
  
    obj.portal_target = null;
    
    // Enter a portal on the left (tile 4 + portal on position 1 (right) + other portal exists)
    if(
      tile_at(obj.x + obj.vx, obj.y + 16) == 4
      &&
      orange_portal.tile_x >= 0
      &&
      blue_portal.tile_x == ~~((obj.x + obj.vx) / 32)
      &&
      blue_portal.tile_y == ~~((obj.y + 16) / 32)
      &&
      blue_portal.side == 1
    ){
      obj.portal_target = orange_portal;
    }
    
    if(
      tile_at(obj.x + obj.vx, obj.y + 16) == 4
      &&
      blue_portal.tile_x >= 0
      &&
      orange_portal.tile_x == ~~((obj.x + obj.vx) / 32)
      &&
      orange_portal.tile_y == ~~((obj.y + 16) / 32)
      &&
      orange_portal.side == 1
    ){
      obj.portal_target = blue_portal;
    }
      
    // If the object is entering a portal
    if(obj.portal_target){
      
      // Adjust position and speed
      obj.y = ~~((obj.y + 16) / 32) * 32;
      obj.vy = 0;
      obj.in_portal = true;
      
      // Teleport and maintain the speed for a few frames if the object's left side entered the portal's tile
      if(tile_at(obj.x + obj.vx + obj_width, obj.y + 16) == 4){
        obj.teleport = true;
        obj.momentum = Math.max(-obj.vx, walk_speed);
        obj.vx = 0;
        obj.teleport_idle = 8;
      }
    }
    
    // Stop going left if there's a solid tile or end of the level on the left
    else if(
      is_solid(tile_at(obj.x + obj.vx, obj.y))
      ||
      is_solid(tile_at(obj.x + obj.vx, obj.y + 31))
    ){
      obj.x = ~~((obj.x + obj.vx) / 32) * 32 + 32;
      obj.vx = 0;
    }
    if(obj.x < 0){
      obj.x = 0;
      obj.vx = 0;
    }
    
    // Stop going left if there's a pipe there
    for(j in level_data.pipes){
      if(
        obj.x + obj.vx >= level_data.pipes[j][0] * 32 + 64 - 16
        &&
        obj.x + obj.vx <= level_data.pipes[j][0] * 32 + 64
        &&
        obj.y + 31 >= pipes_state[j].y
        &&
        obj.y <= pipes_state[j].y_base
      ){
        obj.x = level_data.pipes[j][0] * 32 + 64;
        obj.vx = 0;
      }
    }
  }
  
  // Apply horizontal speed
  obj.x += obj.vx;
  
  // Apply gravity and compute vertical speed (but don't update position yet)
  if(!obj.in_portal){
    obj.grounded = false;
    obj.vy += gravity;
    if(obj.vy > max_fall_speed){
      obj.vy = max_fall_speed;
    }
  }
  
  // If object's bottom (lower quarter) is on a solid tile (ex: toggled block), fall under it
  if(!obj.in_portal && is_solid(tile_at(obj.x + obj_width / 2, obj.y + 24))){
    obj.y = ~~(obj.y / 32) * 32 + 32;
  }
  
  // Go down
  if(obj.vy > 0){
    
    // Stop falling if a solid tile is under object (or a spike, if the object is a cube)
    if(
      is_solid(tile_at(obj.x, obj.y + 32 + obj.vy))
      ||
      is_solid(tile_at(obj.x + obj_width, obj.y + 32 + obj.vy))
      ||
      (type == 1 && tile_at(obj.x, obj.y + 32 + obj.vy) == 7)
      ||
      (type == 1 && tile_at(obj.x + obj_width, obj.y + 32 + obj.vy) == 7)
    ){
      obj.y = ~~((obj.y + obj.vy) / 32) * 32;
      obj.vy = 0;
      obj.grounded = true;
    }
    
    // Stop falling if a cube is under object (only if the cube and the object are not in a portal)
    for(i in level_data.cubes){
      if(
        !level_data.cubes[i].in_portal
        &&
        !obj.in_portal
        &&
        obj.x + obj_width > level_data.cubes[i].x
        &&
        obj.x < level_data.cubes[i].x + 32
        &&
        obj.y + 31 + obj.vy > level_data.cubes[i].y - 8
        &&
        obj.y + 31 + obj.vy < level_data.cubes[i].y + 20
      ){
        obj.y = level_data.cubes[i].y - 32;
        obj.vy = 0;
        obj.grounded = true;
        obj.cube_below = i;
        obj.position_on_cube = obj.x - level_data.cubes[i].x;
        level_data.cubes[i].weight += obj.weight;
      }
    }
    
    // Stop falling if there's a pipe there
    for(j in level_data.pipes){
      if(
        obj.x + obj_width >= level_data.pipes[j][0] * 32
        &&
        obj.x < level_data.pipes[j][0] * 32 + 64
        &&
        obj.y + 31 + obj.vy >= pipes_state[j].y
        &&
        obj.y + 31 + obj.vy <= pipes_state[j].y + 32
      ){
        obj.y = pipes_state[j].y - 32;
        obj.vy = 0;
        obj.grounded = true;
        obj.on_moving_object = true;
      }
    }
    
    // Stop falling if there's a balance "1" there
    for(j in level_data.balances){
      if(
        obj.x + obj_width >= level_data.balances[j][0] * 32 - 32
        &&
        obj.x < level_data.balances[j][0] * 32 + 64
        &&
        obj.y + 31 + obj.vy >= balances_state[j].y1 - 8
        &&
        obj.y + 31 + obj.vy <= balances_state[j].y1 + 32
      ){
        obj.y = balances_state[j].y1 - 32;
        obj.vy = 0;
        obj.grounded = true;
        obj.on_moving_object = true;
        balances_state[j].weight1 += obj.weight;
      }
    }
    
    // Stop falling if there's a balance "2" there
    for(j in level_data.balances){
      if(
        obj.x + obj_width >= level_data.balances[j][2] * 32 - 32
        &&
        obj.x < level_data.balances[j][2] * 32 + 64
        &&
        obj.y + 31 + obj.vy >= balances_state[j].y2 - 8
        &&
        obj.y + 31 + obj.vy <= balances_state[j].y2 + 32
      ){
        obj.y = balances_state[j].y2 - 32;
        obj.vy = 0;
        obj.grounded = true;
        obj.on_moving_object = true;
        balances_state[j].weight2 += obj.weight;
      }
    }
  }
  
  // Go up (only for Mario)
  if(type == 0 && obj.vy < 0){
    
    // Stop going up if there's a solid tile on top (only for Mario)
    if(
      is_solid(tile_at(obj.x, obj.y + obj.vy))
      ||
      is_solid(tile_at(obj.x + obj_width, obj.y + obj.vy))
    ){
      
      // Break bricks (tile #5)
      if(tile_at(obj.x, obj.y + obj.vy) == 5){
        set_tile(obj.x, obj.y + obj.vy, 0);
      }
      if(tile_at(obj.x + mario_width, obj.y + obj.vy) == 5){
        set_tile(obj.x + mario_width, obj.y + obj.vy, 0);
      }
      
      obj.y = ~~((obj.y + obj.vy) / 32) * 32 + 32;
      obj.vy = 0;
    }
  }
  
  // Update position according to vertical speed
  obj.y += obj.vy;
  
  
  // Teleport
  if(obj.teleport){
    obj.teleport = false;
    
    obj.x = obj.portal_target.tile_x * 32 + (32 - obj_width) / 2;
    obj.y = obj.portal_target.tile_y * 32;
    
    // Top 
    if(obj.portal_target.side == 0){
      obj.vy = -obj.momentum;
      obj.vx = 0;
    }
    
    // right
    if(obj.portal_target.side == 1){
      obj.vx = obj.momentum;
      obj.vy = 0;
    }
    
    // bottom
    if(obj.portal_target.side == 2){
      obj.vy = obj.momentum;
      obj.vx = 0;
    }
    
    // left
    if(obj.portal_target.side == 3){
      obj.vx = -obj.momentum;
      obj.vy = 0;
    }
  }
  
  // Press yellow switch (at the bottom left or right)
  if(tile_at(obj.x, obj.y + 20) == 11){
    set_tile(obj.x, obj.y + 20, 25);
    yellow_toggle = true;
  }
  else if(tile_at(obj.x + obj_width, obj.y + 20) == 11){
    set_tile(obj.x + obj_width, obj.y + 20, 25);
    yellow_toggle = true;
  }
  
  // Press green switch
  for(var i in level_data.pipes){
    
    if(
      obj.x + obj_width >= level_data.pipes[i][3] * 32
      &&
      obj.x <= level_data.pipes[i][3] * 32 + 32
      &&
      obj.y + 32 >= level_data.pipes[i][4] * 32
      &&
      obj.y + 20 <= level_data.pipes[i][4] * 32 + 32
    ){
      pipes_state[i].pressed = true;
    }
  }
}

// Play or replay a given hero (past or present)
var play_hero = (current_mario) => {
  
  // If he's not dead and didn't win yet
  if(current_mario.state != 3 && !win){
    
    // Reset to idle state, consider he's not on a moving object
    current_mario.state = 0;
    current_mario.on_moving_object = false;
    
    // If we're not in the few frames that follow a portal teleportation
    if(!current_mario.teleport_idle){

      // Cancel vx (if hero not on ice)
      if(
        tile_at(current_mario.x, current_mario.y + 33) != 8
        &&
        tile_at(current_mario.x + mario_width, current_mario.y + 33) != 8
      ){
        current_mario.vx = 0;
      }
    
      // Go right (unless if in portal, or being teleported, or slipping left on ice)
      if(
        current_mario.right[frame]
        &&
        !(
          (
            tile_at(current_mario.x, current_mario.y + 33) == 8
            ||
            tile_at(current_mario.x + mario_width, current_mario.y + 33) == 8
          )
          &&
          current_mario.vx != 0
        )
      ){
        current_mario.vx = Math.max(current_mario.vx, walk_speed);
        current_mario.direction = 1;
        
        // Walk animation
        if(current_mario.grounded){
          current_mario.state = 1;
        }
      }
      
      // Go left (unless if in portal, or being teleported, or slipping right on ice)
      if(
        current_mario.left[frame]
        &&
        !(
          (
            tile_at(current_mario.x, current_mario.y + 33) == 8
            ||
            tile_at(current_mario.x + mario_width, current_mario.y + 33) == 8
          )
          &&
          current_mario.vx != 0
        )
      ){
        current_mario.vx = Math.min(current_mario.vx, -walk_speed);
        current_mario.direction = 0;
        
        // Walk animation
        if(current_mario.grounded){
          current_mario.state = 1;
        } 
      }
    }
    
    // Jump (if not in a portal and not slipping on ice)
    if(
      !current_mario.in_portal
      &&
      current_mario.up[frame]
      &&
      current_mario.grounded
      &&
      !(
        (
          tile_at(current_mario.x, current_mario.y + 33) == 8
          ||
          tile_at(current_mario.x + mario_width, current_mario.y + 33) == 8
        )
        &&
        current_mario.vx != 0
      )
    ){
      current_mario.vy -= jump_speed;
      current_mario.grounded = false;
      current_mario.keyup = false;
      current_mario.can_jump = false;
    }
    
    // Jump sprite
    if(current_mario.vy < 0 && !current_mario.grounded){
      current_mario.state = 2;
    }
    
    // Apply gravity and collsions
    gravity_and_collisions(current_mario, mario_width, 0);
    
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
      current_mario.vy = -1 * jump_speed;
    }
    
    // Die (fall)
    if(current_mario.y > 648){
      current_mario.state = 3;
      current_mario.vy = -1.5 * jump_speed;
    }
    
    // Die (crush between a pipe or a balance, and a solid tile)
    if(
      current_mario.on_moving_object
      &&
      (
        is_solid(tile_at(current_mario.x, current_mario.y + 1))
        ||
        is_solid(tile_at(current_mario.x + mario_width, current_mario.y + 1))
      )
    ){
      current_mario.state = 3;
      current_mario.vy = -1 * jump_speed;
    }
    
    // Pick cube
    if(current_mario.pickdrop){
      if(current_mario.cube_held === null){
        for(i in level_data.cubes){
          if(
            current_mario.x + mario_width >= level_data.cubes[i].x
            &&
            current_mario.x <= level_data.cubes[i].x + 31
            &&
            current_mario.y + 31 + 4 >= level_data.cubes[i].y
            &&
            current_mario.y - 2 <= level_data.cubes[i].y + 31
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
      if(current_cube = level_data.cubes[current_mario.cube_held]){
        
        // Drop ahead of hero if he's grounded
        if(current_mario.grounded){
        
          // Left
            if(current_mario.direction == 0){
            current_cube.x = current_mario.x - 20;
          }
          
          // Right
          if(current_mario.direction == 1){
            current_cube.x = current_mario.x + 20;
          }
        }
        
        // Drop in-place if not grounded
        else{
          current_cube.x = current_mario.x;
        }
        
        // Avoid collisions
        if(is_solid(tile_at(current_cube.x, current_cube.y))){
          current_cube.x = ~~((current_cube.x) / 32) * 32 + 32;
        }
        else if(is_solid(tile_at(current_cube.x, current_cube.y + 31))){
          current_cube.x = ~~((current_cube.x) / 32) * 32 + 32;
        }
        else if(is_solid(tile_at(current_cube.x + 32, current_cube.y))){
          current_cube.x = ~~((current_cube.x) / 32) * 32 - 1;
        }
        else if(is_solid(tile_at(current_cube.x + 32, current_cube.y + 31))){
          current_cube.x = ~~((current_cube.x) / 32) * 32 - 1;
        }
          
        current_cube.mario = null;
        level_data.cubes[current_mario.cube_held] = current_cube;
        current_mario.cube_held = null;
        current_mario.weight = 1;
      }
    }
    
    // Hold cube
    if(current_mario.cube_held !== null){
      
      // Left
      if(current_mario.direction == 0){
        level_data.cubes[current_mario.cube_held].x = current_mario.x - 6;
      }
      if(current_mario.direction == 1){
        level_data.cubes[current_mario.cube_held].x = current_mario.x;
      }
      
      // Animate cube grab (make it last 5 frames)
      if(current_mario.pick_cube_animation_frame){
        current_mario.pick_cube_animation_frame--;
      }
      
      // Place cube over Mario (unless he's passing through a portal or there's a solid tile above, in this case hold it lower)
      if(current_mario.in_portal){ 
        level_data.cubes[current_mario.cube_held].y = current_mario.y;
      }
      else if(is_solid(tile_at(current_mario.x, current_mario.y - 28)) || is_solid(tile_at(current_mario.x + mario_width, current_mario.y - 28))){
        level_data.cubes[current_mario.cube_held].y = ~~((current_mario.y + 4) / 32) * 32;
      }
      else{
        level_data.cubes[current_mario.cube_held].y = current_mario.y - 32 + current_mario.pick_cube_animation_frame * 4;
      }
    }
    
    // If no cube is held, cancel space key
    else {
      current_mario.pickdrop = 0;
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
    
    // Send portals (only if he's not currently in a portal)
    if(!current_mario.in_portal && (current_mario.leftclick[frame] || current_mario.rightclick[frame])){
        
      // Cancel current shoots
      current_mario.shoot_blue = 0;
      current_mario.shoot_orange = 0;
      
      // Left click: current mario sends a blue portal
      if(current_mario.leftclick[frame]){
        current_mario.shoot_blue = 1;
      }
      
      // Right click: current mario sends a orange portal
      if(current_mario.rightclick[frame]){
        current_mario.shoot_orange = 1;
      }
      
      // Compute the angle made by the line "Mario - click coordinates" and the horizontal axis
      current_mario.angle = Math.atan2(x - (current_mario.x + mario_width / 2), y - (current_mario.y + 40 + 16));
      current_mario.portal_shoot_x = current_mario.x + mario_width / 2;
      current_mario.portal_shoot_y = current_mario.y + 16;
      current_mario.portal_shoot_vx = Math.sin(current_mario.angle);
      current_mario.portal_shoot_vy = Math.cos(current_mario.angle);
    }
    
    // Blue portal (beam / open portal)
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

          // Reflect ray if tile is #8 (ice)
          if(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y) == 8){
            current_mario.shoot_blue = 1;
            if(temp_side == 0 || temp_side == 2){
              current_mario.portal_shoot_vy = -current_mario.portal_shoot_vy;
            }
            else //if(temp_side == 1 || temp_side == 3)
            {
              current_mario.portal_shoot_vx = -current_mario.portal_shoot_vx;
            }
          }
          
          // Place portal if tile is #4 (white wall) and no orange portal is here yet
          if(
            tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y) == 4
            &&
            (~~(current_mario.portal_shoot_x / 32) != orange_portal.tile_x || ~~(current_mario.portal_shoot_y / 32) != orange_portal.tile_y || orange_portal.side != temp_side)
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
    
    // Orange portal (beam / open portal)
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

          // Reflect ray if tile is #8 (ice)
          if(tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y) == 8){
            current_mario.shoot_orange = 1;
            if(temp_side == 0 || temp_side == 2){
              current_mario.portal_shoot_vy = -current_mario.portal_shoot_vy;
            }
            else //if(temp_side == 1 || temp_side == 3)
            {
              current_mario.portal_shoot_vx = -current_mario.portal_shoot_vx;
            }
          }
          
          // Place portal if tile is #4 (white wall) and no blue portal is here yet
          if(
            tile_at(current_mario.portal_shoot_x, current_mario.portal_shoot_y) == 4
            &&
            (~~(current_mario.portal_shoot_x / 32) != blue_portal.tile_x || ~~(current_mario.portal_shoot_y / 32) != blue_portal.tile_y || blue_portal.side != temp_side)
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
}

// OK

// Draw hero (past or present)
var draw_hero = (hero) => {
  c.save();
  c.translate(hero.x + mario_width / 2, hero.y);
  
  // Facing left
  if(hero.direction == 0){
    c.scale(-1,1);
  }

  c.drawImage(tileset, [26, [27,28,29][~~(frame / 2) % 3], 30, 31][hero.state] * 16, 0, 16, 16, - mario_width / 2, 40, 32, 32);
  c.restore();
}

// OK

// Draw portals (foreground)
var draw_portals = () => {
  
  for(i in j = {"blue": blue_portal, "orange": orange_portal }){
    
    draw_tile(4, j[i].tile_x, j[i].tile_y);
    
  }
    
  for(i in j = {"blue": blue_portal, "orange": orange_portal }){

    c.fillStyle = i;
    
    if(j[i].side == 0){
      c.fillRect(j[i].tile_x * 32, j[i].tile_y * 32 + 40 - 8, 32, 8);
    }
    if(j[i].side == 1){
      c.fillRect(j[i].tile_x * 32 + 28, j[i].tile_y * 32 + 40, 8, 32);
    }
    if(j[i].side == 2){
      c.fillRect(j[i].tile_x * 32, j[i].tile_y * 32 + 40 + 28, 32, 8);
    }
    if(j[i].side == 3){
      c.fillRect(j[i].tile_x * 32 - 4, j[i].tile_y * 32 + 40, 8, 32);
    }
  }
}

// OK

// Update mechanisms
var update_mechanisms = () => {
  
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
      && !is_solid(tile_at(level_data.balances[i][2] * 32, balances_state[i].y2 - 4))
      && !is_solid(tile_at(level_data.balances[i][2] * 32 + 32, balances_state[i].y2 - 4))
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
      && !is_solid(tile_at(level_data.balances[i][0] * 32, balances_state[i].y1 - 4))
      && !is_solid(tile_at(level_data.balances[i][0] * 32 + 32, balances_state[i].y1 - 4))
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
}

// OK

// Win animation (write "CLEARED" for 30 frames and exit)
var victory = () => {
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

// OK

// Move and draw all cubes
var move_cubes = () => {
  for(i in level_data.cubes){
    
    // If cube is not in a #4 solid tile, assume it's not in a portal anymore
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

    // Draw cube
    c.drawImage(tileset, 12 * 16, 0, 16, 16, level_data.cubes[i].x, 40 + level_data.cubes[i].y, 32, 32);
  }
}