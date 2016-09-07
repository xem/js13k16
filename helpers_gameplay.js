// Functions used by the game loop (play)

// First frame inits (also happen after time travels)
var first_frame = function(){
  
  reset_current_level(1);
    
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
      if(k < 20 && !is_solid(tile_at(level_data.pipes[i][0] * 32, k * 32)) && !is_solid(tile_at(level_data.pipes[i][0] * 32 + 1 * 32, k * 32)) && !end_pipe){
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
          level_data.cubes.push({x: i * 32, y: j * 32, vy: 0, hero: null});
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
      
      // Tile #23: time machine (save starting point coordinates, place hero there at first frame)
      if(drawn_tile == 23 && frame == 0){
        level_data.start = [i, j];
        current_hero.x = level_data.start[0] * 32;
        current_hero.y = level_data.start[1] * 32;
      }
    }
  }
  
  // Frame 0: re-place all past heros at the start position and reset their movement properties
  if(frame == 0){
    
    for(hero in heros){
      heros[hero].x = level_data.start[0] * 32;
      heros[hero].y = level_data.start[1] * 32;
      heros[hero].vx = 0;
      heros[hero].vy = 0;
      heros[hero].keyleft = false;
      heros[hero].keyup = false;
      heros[hero].keyright = false;
      heros[hero].keyspace = false;
      heros[hero].safe = false;
      heros[hero].direction = 1;
    }
  }
}

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
  
  current_hero.weight = 1;
  
  for(i in level_data.cubes){
    level_data.cubes[i].weight = 1;
  }
  
  for(i in level_data.balances){
    balances_state[i].weight1 = 0;
    balances_state[i].weight2 = 0;
  }
}

// Apply gravity and collisions to a given object (type 0: hero, type 1: cube), plus make it enter in portals
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
      
      // Teleport and maintain the speed for a few frames if the object's right side entered the portal's tile
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
  
  // Apply gravity if object is not in a portal, and compute vertical speed
  if(!obj.in_portal){
    obj.grounded = false;
    obj.vy += gravity;
    if(obj.vy > max_fall_speed){
      obj.vy = max_fall_speed;
    }
  }
    
  // If object's bottom (lower quarter) is on a solid tile (ex: toggled block), fall under it
  else if(!obj.in_portal && is_solid(tile_at(obj.x + obj_width / 2, obj.y + 28))){
    obj.y = ~~(obj.y / 32) * 32 + 32;
  }
  
  // Go down
  if(obj.vy > 0){
    
    obj.portal_target = null;
    
    // Enter a portal on the bottom (tile 4 + portal on position 0 (top) + other portal exists)
    if(
      tile_at(obj.x + obj_width / 2, obj.y + 32 + obj.vy) == 4
      &&
      orange_portal.tile_x >= 0
      &&
      blue_portal.tile_x == ~~((obj.x + obj_width / 2) / 32)
      &&
      blue_portal.tile_y == ~~((obj.y + 32 + obj.vy) / 32)
      &&
      blue_portal.side == 0
    ){
      obj.portal_target = orange_portal;
    }
    
    if(
      tile_at(obj.x + obj.vx / 2, obj.y + 32 + obj.vy) == 4
      &&
      blue_portal.tile_x >= 0
      &&
      orange_portal.tile_x == ~~((obj.x + obj_width / 2) / 32)
      &&
      orange_portal.tile_y == ~~((obj.y + 32 + obj.vy) / 32)
      &&
      orange_portal.side == 0
    ){
      obj.portal_target = blue_portal;
    }
      
    // If the object is entering a portal
    if(obj.portal_target){
      
      // Adjust position and speed
      obj.x = ~~((obj.x + obj_width / 2) / 32) * 32 + (32 - obj_width) / 2;
      obj.vx = 0;
      obj.in_portal = true;
      
      // Teleport and maintain the speed for a few frames if the object's top side entered the portal's tile
      if(
        // Low speed
        (obj.vy < 10 && tile_at(obj.x + obj_width / 2, obj.y + 32 + obj.vy - 16) == 4)
        ||
        
        // High speed
        (obj.vy > 10 && tile_at(obj.x + obj_width / 2, obj.y + 32 + obj.vy) == 4)
      ){
        obj.teleport = true;
        obj.momentum = Math.max(obj.vy, 6);
        obj.vy = 0;
        obj.teleport_idle = 8;
      }
    }
  
    // Stop falling if a solid tile is under object (or a spike, if the object is a cube)
    else if(
      is_solid(tile_at(obj.x, obj.y + 32 + obj.vy))
      ||
      is_solid(tile_at(obj.x + obj_width - 1, obj.y + 32 + obj.vy))
      ||
      (type == 1 && tile_at(obj.x, obj.y + 32 + obj.vy) == 7)
      ||
      (type == 1 && tile_at(obj.x + obj_width - 1, obj.y + 32 + obj.vy) == 7)
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
        obj.x + obj_width - 1 >= level_data.pipes[j][0] * 32
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
  
  // Go up (only for hero)
  if(obj.vy < 0){
    
    obj.portal_target = null;
    
    // Enter a portal on top (tile 4 + portal on position 2 (bottom) + other portal exists)
    if(
      tile_at(obj.x + obj_width / 2, obj.y + obj.vy) == 4
      &&
      orange_portal.tile_x >= 0
      &&
      blue_portal.tile_x == ~~((obj.x + obj_width / 2) / 32)
      &&
      blue_portal.tile_y == ~~((obj.y + obj.vy) / 32)
      &&
      blue_portal.side == 2
    ){
      obj.portal_target = orange_portal;
    }
    
    if(
      tile_at(obj.x + obj.vx / 2, obj.y + obj.vy) == 4
      &&
      blue_portal.tile_x >= 0
      &&
      orange_portal.tile_x == ~~((obj.x + obj_width / 2) / 32)
      &&
      orange_portal.tile_y == ~~((obj.y + obj.vy) / 32)
      &&
      orange_portal.side == 2
    ){
      obj.portal_target = blue_portal;
    }
      
    // If the object is entering a portal
    if(obj.portal_target){
      
      // Adjust position and speed
      obj.x = ~~((obj.x + obj_width / 2) / 32) * 32 + (32 - obj_width) / 2;
      obj.vx = 0;
      obj.in_portal = true;
      
      // Teleport and maintain the speed for a few frames if the object's bottom side entered the portal's tile
      if(tile_at(obj.x + obj_width / 2, obj.y + obj.vy + 10) == 4){
        obj.teleport = true;
        obj.momentum = 6;
        obj.vy = 0;
        obj.teleport_idle = 8;
      }
    }
    
    // Stop going up if there's a solid tile on top (only for hero)
    else if(
      is_solid(tile_at(obj.x, obj.y + obj.vy))
      ||
      is_solid(tile_at(obj.x + obj_width, obj.y + obj.vy))
    ){
      
      // Break bricks (tile #5 => tile #0)
      if(tile_at(obj.x, obj.y + obj.vy) == 5){
        set_tile(obj.x, obj.y + obj.vy, 0);
      }
      if(tile_at(obj.x + hero_width, obj.y + obj.vy) == 5){
        set_tile(obj.x + hero_width, obj.y + obj.vy, 0);
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
    obj.grounded = false;
    
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
      obj.x += 8;
    }
    
    // bottom
    if(obj.portal_target.side == 2){
      obj.vy = obj.momentum;
      obj.vx = 0;
      
      //  Ensure the hero falls off the portal and is controllable soon
      obj.y += 8;
      obj.teleport_idle = 2;
    }
    
    // left
    if(obj.portal_target.side == 3){
      obj.vx = -obj.momentum;
      obj.vy = 0;
      obj.x -= 8;
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
  
  // Go down if we're stuck in solid yellow blocks (tile #9){
  if(tile_at(obj.x, obj.y + 31) == 9 || tile_at(obj.x + obj_width - 1, obj.y + 31) == 9){
    obj.y = ~~(obj.y / 32) * 32 + 32;
  }
}

// Play or replay a given hero (past: 1 / present: 0)
var play_hero = (this_hero, past) => {
  
  // If he's not dead and didn't win yet
  if(this_hero.state != 3 && !win && !paradox_frame){
    
    // Reset to idle state, consider he's not on a moving object
    this_hero.state = 0;
    this_hero.on_moving_object = false;
    
    // If we're not in the few frames that follow a portal teleportation
    if(!this_hero.teleport_idle){

      // Cancel vx (if hero not on ice and not in the air or in the air but without horizontal momentum)
      if(
        (
          this_hero.grounded
          &&
          tile_at(this_hero.x, this_hero.y + 33) != 8
          &&
          tile_at(this_hero.x + hero_width, this_hero.y + 33) != 8
        )
        ||
        (
          !this_hero.grounded
          &&
          Math.abs(this_hero.vx) < 10
        )
      ){
        this_hero.vx = 0;
      }
    
      // Go right (unless if in portal, or being teleported, or slipping left on ice)
      if(
        this_hero.right[frame]
        &&
        !(
          (
            tile_at(this_hero.x, this_hero.y + 33) == 8
            ||
            tile_at(this_hero.x + hero_width, this_hero.y + 33) == 8
          )
          &&
          this_hero.vx != 0
        )
      ){
        if(this_hero.direction == 1){
          this_hero.vx = Math.max(this_hero.vx, walk_speed);
        }
        else {
          this_hero.vx = 0
        }
        this_hero.direction = 1;
        
        // Walk animation
        if(this_hero.grounded){
          this_hero.state = 1;
        }
      }
      
      // Go left (unless if in portal, or being teleported, or slipping right on ice)
      if(
        this_hero.left[frame]
        &&
        !(
          (
            tile_at(this_hero.x, this_hero.y + 33) == 8
            ||
            tile_at(this_hero.x + hero_width, this_hero.y + 33) == 8
          )
          &&
          this_hero.vx != 0
        )
      ){
        if(this_hero.direction == 0){
          this_hero.vx = Math.min(this_hero.vx, -walk_speed);
        }
        else {
          this_hero.vx = 0
        }
        this_hero.direction = 0;
        
        // Walk animation
        if(this_hero.grounded){
          this_hero.state = 1;
        } 
      }
    }
    
    // Jump (if not in a portal and not slipping on ice)
    if(
      !this_hero.in_portal
      &&
      this_hero.up[frame]
      &&
      this_hero.grounded
      &&
      !(
        (
          tile_at(this_hero.x, this_hero.y + 33) == 8
          ||
          tile_at(this_hero.x + hero_width, this_hero.y + 33) == 8
        )
        &&
        this_hero.vx != 0
      )
    ){
      this_hero.vy -= jump_speed;
      this_hero.grounded = false;
      this_hero.keyup = false;
      this_hero.can_jump = false;
      this_hero.cube_below = null;
    }
    
    // Jump sprite
    if(this_hero.vy < 0 && !this_hero.grounded){
      this_hero.state = 2;
    }
    
    // Apply gravity and collsions
    gravity_and_collisions(this_hero, hero_width, 0);
    
    // Collect coins (tile 6 => tile 0)
    if(tile_at(this_hero.x + hero_width / 2 - 8, this_hero.y + 16 - 8) == 6 ){
      set_tile(this_hero.x + hero_width / 2 - 8, this_hero.y + 16 - 8, 0);
    }
    if(tile_at(this_hero.x + hero_width / 2 + 8, this_hero.y + 16 - 8) == 6){
      set_tile(this_hero.x + hero_width / 2 + 8, this_hero.y + 16 - 8, 0);
    }
    if(tile_at(this_hero.x + hero_width / 2 - 8, this_hero.y + 16 + 8) == 6){
      set_tile(this_hero.x + hero_width / 2 - 8, this_hero.y + 16 + 8, 0);
    }
    if(tile_at(this_hero.x + hero_width / 2 + 8, this_hero.y + 16 + 8) == 6){
      set_tile(this_hero.x + hero_width / 2 + 8, this_hero.y + 16 + 8, 0);
    }
    
    // Press Shift
    if(this_hero.shift[frame]){
      
      // If in front of the time machine (tile #23)
      if(
        tile_at(this_hero.x, this_hero.y) == 23
        ||
        tile_at(this_hero.x + hero_width, this_hero.y) == 23
        ||
        tile_at(this_hero.x, this_hero.y + 31) == 23
        ||
        tile_at(this_hero.x + hero_width, this_hero.y + 31) == 23
      ){
        
        // Present hero: remember the frame and add it to the array of past heros and go back to the beginning of time (frame -1)
        if(!past){
          this_hero.last_frame = frame;
          heros.push(this_hero);
          frame = -1;
          current_hero = reset_hero();
        }
        
        // Past hero: remember that he's safe
        else{
          this_hero.safe = true;
        }
      }
    }
    
    // Die (spike)
    if(
      tile_at(this_hero.x + 3, this_hero.y) == 7
      ||
      tile_at(this_hero.x + hero_width - 3, this_hero.y) == 7
      ||
      tile_at(this_hero.x + 3, this_hero.y + 5) == 7
      ||
      tile_at(this_hero.x + hero_width - 3, this_hero.y + 5) == 7
    ){
      this_hero.state = 3;
      this_hero.vy = -1 * jump_speed;
    }
    
    // Die (fall)
    if(this_hero.y > 648){
      this_hero.state = 3;
      this_hero.vy = -1.5 * jump_speed;
    }
    
    // Die (crush between a pipe or a balance, and a solid tile)
    if(
      this_hero.on_moving_object
      &&
      (
        is_solid(tile_at(this_hero.x, this_hero.y + 1))
        ||
        is_solid(tile_at(this_hero.x + hero_width, this_hero.y + 1))
      )
    ){
      this_hero.state = 3;
      this_hero.vy = -1 * jump_speed;
    }
    
    // Pick cube
    if(this_hero.pickdrop){
      if(this_hero.cube_held === null){
        for(i in level_data.cubes){
          if(
            this_hero.x + hero_width >= level_data.cubes[i].x
            &&
            this_hero.x <= level_data.cubes[i].x + 31
            &&
            this_hero.y + 31 + 4 >= level_data.cubes[i].y
            &&
            this_hero.y <= level_data.cubes[i].y + 31
          ){
            this_hero.cube_held = i;
            level_data.cubes[i].hero = this_hero;
            this_hero.pick_cube_animation_frame = 5;
            break;
          }
        }
      }
    }
    
    // Drop cube
    else if(current_cube = level_data.cubes[this_hero.cube_held]){
      
      current_cube.x = this_hero.x;
      
       
      // Throw it if hero is not grounded
      if(!this_hero.grounded){
        
        // Left
        if(this_hero.direction == 0){
          current_cube.vx = -14;
        }
        
        // Right
        else{
          current_cube.vx = 14;
        }
      }
      //document.title = this_hero.grounded + " " + current_cube.vx;
      
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
        
      current_cube.hero = null;
      level_data.cubes[this_hero.cube_held] = current_cube;
      this_hero.cube_held = null;
      this_hero.weight = 1;
    }
    
    // Hold cube
    if(this_hero.cube_held !== null){
      
      // Left
      if(this_hero.direction == 0){
        level_data.cubes[this_hero.cube_held].x = this_hero.x - 6;
      }
      if(this_hero.direction == 1){
        level_data.cubes[this_hero.cube_held].x = this_hero.x - 4;
      }
      
      // Animate cube grab (make it last 5 frames)
      if(this_hero.pick_cube_animation_frame){
        this_hero.pick_cube_animation_frame--;
      }
      
      // Place cube over hero (unless he's passing through a portal or there's a solid tile above, in this case hold it lower)
      if(this_hero.in_portal){ 
        level_data.cubes[this_hero.cube_held].y = this_hero.y;
      }
      else if(is_solid(tile_at(this_hero.x, this_hero.y - 28)) || is_solid(tile_at(this_hero.x + hero_width, this_hero.y - 28))){
        level_data.cubes[this_hero.cube_held].y = ~~((this_hero.y + 4) / 32) * 32;
      }
      else{
        level_data.cubes[this_hero.cube_held].y = this_hero.y - 32 + this_hero.pick_cube_animation_frame * 4;
      }
    }
    
    // If no cube is held, cancel space key
    else {
      this_hero.pickdrop = 0;
    }
    
    // Win (all coins gathered and touch flag)
    if(tile_at(this_hero.x + hero_width / 2, this_hero.y + 16) == 2 || tile_at(this_hero.x + hero_width / 2, this_hero.y + 16) == 24){
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
        this_hero.state = 0;
      }
    }
    
    // Send portals (only if hero's not currently in a portal)
    if(!this_hero.in_portal && (this_hero.leftclick[frame] || this_hero.rightclick[frame])){
        
      // Cancel current shoots
      this_hero.shoot_blue = 0;
      this_hero.shoot_orange = 0;
      
      // Left click: current hero sends a blue portal
      if(this_hero.leftclick[frame]){
        this_hero.shoot_blue = 1;
        
        // Compute the angle made by the line "hero - click coordinates" and the horizontal axis
        this_hero.angle = Math.atan2(this_hero.leftclick[frame][0] - (this_hero.x + hero_width / 2), this_hero.leftclick[frame][1] - (this_hero.y + 40 + 16));
      }
      
      // Right click: current hero sends a orange portal
      if(this_hero.rightclick[frame]){
        this_hero.shoot_orange = 1;
        
        // Compute the angle made by the line "hero - click coordinates" and the horizontal axis
        this_hero.angle = Math.atan2(this_hero.rightclick[frame][0] - (this_hero.x + hero_width / 2), this_hero.rightclick[frame][1] - (this_hero.y + 40 + 16));
      }
      
      // Compute portal beam movement
      this_hero.portal_shoot_x = this_hero.x + hero_width / 2;
      this_hero.portal_shoot_y = this_hero.y + 16;
      this_hero.portal_shoot_vx = Math.sin(this_hero.angle);
      this_hero.portal_shoot_vy = Math.cos(this_hero.angle);
      
      
    }
    
    // Portal beam (reflect on ice / open portal on white wall)
    for(current_portal in portals = [["shoot_blue", blue_portal, "blue"], ["shoot_orange", orange_portal, "orange"]]){
    
      if(this_hero[portals[current_portal][0]]){
      
        // Make beam advance with baby steps
        for(i = 0; i < 40; i++){
          this_hero[portals[current_portal][0]] += .001;
          this_hero.portal_shoot_x += this_hero[portals[current_portal][0]] * this_hero.portal_shoot_vx;
          this_hero.portal_shoot_y += this_hero[portals[current_portal][0]] * this_hero.portal_shoot_vy;
          
          // If beam hits solid or spike (tile #7)
          if(is_solid(tile_at(this_hero.portal_shoot_x, this_hero.portal_shoot_y)) || tile_at(this_hero.portal_shoot_x, this_hero.portal_shoot_y) == 7){
            
            // Cancel any existing portal of this color
            this_hero[portals[current_portal][0]] = 0;
            
            // Define on which side the portal goes (0: top, 1: right, 2: bottom, 3: left)
            // Avoid opening a portal between two solid tiles, and on sides not reachable given the current angle
            if(this_hero.portal_shoot_x % 32 < 4 && !is_solid(tile_at(this_hero.portal_shoot_x - 32, this_hero.portal_shoot_y)) && this_hero.portal_shoot_vx > 0){
              temp_side = 3;
            }
            if(this_hero.portal_shoot_x % 32 > 28 && !is_solid(tile_at(this_hero.portal_shoot_x + 32, this_hero.portal_shoot_y)) && this_hero.portal_shoot_vx < 0){
              temp_side = 1;
            }
            if(this_hero.portal_shoot_y % 32 < 4 && !is_solid(tile_at(this_hero.portal_shoot_x, this_hero.portal_shoot_y - 32)) && this_hero.portal_shoot_vy > 0){
              temp_side = 0;
            }
            if(this_hero.portal_shoot_y % 32 > 28 && !is_solid(tile_at(this_hero.portal_shoot_x, this_hero.portal_shoot_y + 32)) && this_hero.portal_shoot_vy < 0){
              temp_side = 2;
            }

            // Reflect ray if tile is #8 (ice)
            if(tile_at(this_hero.portal_shoot_x, this_hero.portal_shoot_y) == 8){
              this_hero[portals[current_portal][0]] = 1;
              if(temp_side == 0){
                this_hero.portal_shoot_vy = -this_hero.portal_shoot_vy;
                this_hero.portal_shoot_y = ~~(this_hero.portal_shoot_y / 32) * 32 - 1;
              }
              else if(temp_side == 2){
                this_hero.portal_shoot_vy = -this_hero.portal_shoot_vy;
                this_hero.portal_shoot_y = ~~(this_hero.portal_shoot_y / 32) * 32 + 32 + 1;
              }
              else if(temp_side == 1){
                this_hero.portal_shoot_vx = -this_hero.portal_shoot_vx;
                this_hero.portal_shoot_x = ~~(this_hero.portal_shoot_x / 32) * 32 + 32 + 1;
              }
              else //if(temp_side == 3)
              {
                this_hero.portal_shoot_vx = -this_hero.portal_shoot_vx;
                this_hero.portal_shoot_x = ~~(this_hero.portal_shoot_x / 32) * 32 - 1;
              }
            }
            
            // Place portal if tile is #4 (white wall) and no orange portal is here yet
            if(
              tile_at(this_hero.portal_shoot_x, this_hero.portal_shoot_y) == 4
              &&
              (~~(this_hero.portal_shoot_x / 32) != portals[1 - current_portal][1].tile_x || ~~(this_hero.portal_shoot_y / 32) != portals[1 - current_portal][1].tile_y || portals[1 - current_portal][1].side != temp_side)
            ){
              portals[current_portal][1].tile_x = ~~(this_hero.portal_shoot_x / 32);
              portals[current_portal][1].tile_y = ~~(this_hero.portal_shoot_y / 32);
              portals[current_portal][1].side = temp_side;
            }
            break;
          }
          else{
            c.fillStyle = portals[current_portal][2];
            c.fillRect(this_hero.portal_shoot_x, this_hero.portal_shoot_y + 40, 6, 6);        
          }
        }
      }
    }
    
    // If hero is not in a #4 solid tile, assume he's not in a portal
    if(
      tile_at(this_hero.x + 1, this_hero.y + 1) != 4
      &&
      tile_at(this_hero.x + hero_width - 1, this_hero.y + 1) != 4
      &&
      tile_at(this_hero.x + 1, this_hero.y + 31) != 4
      &&
      tile_at(this_hero.x + + hero_width - 1, this_hero.y + 31) != 4
    ){
      this_hero.in_portal = false;
    }
    
    // Decrement teleportation idle delay
    if(this_hero.teleport_idle){
      this_hero.teleport_idle--;
    }
  }
  
  // Death animation
  if(this_hero.state == 3){
    this_hero.vy += gravity;
    if(this_hero.vy > max_fall_speed){
      this_hero.vy = max_fall_speed;
    }
    this_hero.y += this_hero.vy;
  }
}

// Draw a hero (past: 1 / present: 0)
var draw_hero = (hero, past) => {
  c.save();
  
  // Go to the hero's position
  c.translate(hero.x + hero_width / 2 - 2, hero.y);
  
  // Facing left
  if(hero.direction == 0){
    c.scale(-1, 1);
  }
    
  // Past: alpha 0.5
  if(past){
    c.globalAlpha = 0.75;
  }
  
  // Present and past heros exist: add arrow to present
  else if(heros.length){
    c.fillStyle = "#fff";
    c.fillText("▼", 0, 10);
  }

  // Draw (except if it's a past hero that has finished playing)
  if(! (past && frame > hero.last_frame)){
    c.drawImage(tileset, [26, [27,28,29][~~(frame / 2) % 3], 30, 31][hero.state] * 16, 0, 16, 16, - hero_width / 2, 40, 32, 32);
  }
  
  c.restore();
}

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

// Win animation (write "CLEARED" for 30 frames and exit)
// Defeat (write "LOST" or "PARADOX" for 30 frames and exit)
var victory_or_defeat = () => {
  
  c.font = "bold 100px arial";
  c.fillStyle = "#000";
  c.textAlign = "center";
  
  // Win
  if(win){
    win_frame++;
    c.fillText("CLEARED!", 640, 350);
  }
  
  // Current hero dies
  if(current_hero.state == 3){
    lose_frame++;
    c.fillText("LOST!", 640, 350);
  }
  
  for(hero in heros){

    // Past hero dies or gets stuck (not at the time machine at the end of his frame record)
    if(heros[hero].state == 3 || (heros[hero].last_frame < frame && !heros[hero].safe)){
      paradox_frame++;
      c.fillText("PARADOX!", 640, 350);
    }
  }
  
  if(lose_frame >= 30){
    a.width ^= 0;
    clearInterval(loop);
    screen = last_screen;
    level_data.tested = true;
    a.width ^= 0;
    draw_screen();
  }
  
  // Paradox (glitch)
  if(paradox_frame){
    for(m = ~~(paradox_frame / 5); m--;){
      c.drawImage(a, i = Math.random() * 1280, j = Math.random() * 648, k = Math.random() * 1280, l = Math.random() * 648, i + Math.random() * 100 - 50, j + Math.random() * 100 - 50, k, l);
    }
  }
  
  if(win_frame >= 30 || lose_frame >= 30 || paradox_frame >= 80){
    a.width ^= 0;
    clearInterval(loop);
    screen = last_screen;
    level_data.tested = true;
    a.width ^= 0;
    draw_screen();
  }
}

// Move and draw all cubes
var move_cubes = () => {
  for(var i in level_data.cubes){
    
    // If cube is not in a #4 solid tile, assume it's not in a portal anymore
    if(
      tile_at(level_data.cubes[i].x + 1, level_data.cubes[i].y + 1) != 4
      &&
      tile_at(level_data.cubes[i].x + 32 - 1, level_data.cubes[i].y + 1) != 4
      &&
      tile_at(level_data.cubes[i].x + 1, level_data.cubes[i].y + 31) != 4
      &&
      tile_at(level_data.cubes[i].x + 32 - 1, level_data.cubes[i].y + 31) != 4
    ){
      level_data.cubes[i].in_portal = false;
    }
    
    // Decrement teleportation idle delay
    if(level_data.cubes[i].teleport_idle){
      level_data.cubes[i].teleport_idle--;
    }  
    
    // Apply gravity and collsions if the cube is not held
    if(level_data.cubes[i].hero === null){
      if(!level_data.cubes[i].teleport_idle && !is_solid(tile_at(level_data.cubes[i].x, level_data.cubes[i].y + 31)) && !is_solid(tile_at(level_data.cubes[i].x + 31, level_data.cubes[i].y + 31))){
        if(level_data.cubes[i].vx > 2){
          level_data.cubes[i].vx -= 2;
        }
        else if(level_data.cubes[i].vx < -2){
          level_data.cubes[i].vx += 2;
        }
        else{
          level_data.cubes[i].vx = 0;
        }
      }
      gravity_and_collisions(level_data.cubes[i], 32, 1);
    }

    // Draw cube
    c.drawImage(tileset, 12 * 16, 0, 16, 16, level_data.cubes[i].x, 40 + level_data.cubes[i].y, 32, 32);
  }
}
