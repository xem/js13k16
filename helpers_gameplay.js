// Functions used by the game loop (play())

// First frame inits
var first_frame = function(){
  // Build map
  level_data.tiles = [];
  for(var j = 0; j < 20; j++){
    level_data.tiles[j] = [];
    for(var i = 0; i < 40; i++){
      level_data.tiles[j][i] = level_data.hash.charCodeAt(j * 40 + i) - 0x30;
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

// Move and draw pipes
var move_draw_pipes = function(){
  for(var i in level_data.pipes){
    
    // Go to position 2 when switch is pressed
    if(pipes_state[i].pressed){
      
      // Go up
      if(pipes_state[i].y > level_data.pipes[i][2] * 32){
        pipes_state[i].y = Math.max(pipes_state[i].y - 4, level_data.pipes[i][2] * 32);
      }
      
      // Go down
      if(pipes_state[i].y < level_data.pipes[i][2] * 32){
        pipes_state[i].y = Math.min(pipes_state[i].y + 4, level_data.pipes[i][2] * 32);
      }
    }
    
    // Go to position 1 when switch is not pressed
    else {
      
      // Go up
      if(pipes_state[i].y > level_data.pipes[i][1] * 32){
        pipes_state[i].y = Math.max(pipes_state[i].y - 4, level_data.pipes[i][1] * 32);
      }
      
      // Go down
      if(pipes_state[i].y < level_data.pipes[i][1] * 32){
        pipes_state[i].y = Math.min(pipes_state[i].y + 4, level_data.pipes[i][1] * 32);
      }
    }

    // Draw pipe body    
    end_pipe = false;
    for(var k = ~~(pipes_state[i].y / 32) + 1; k < 21; k++){
      if(k < 20 && !level_data.tiles[k][level_data.pipes[i][0]] && !level_data.tiles[k][level_data.pipes[i][0] + 1] && !end_pipe){
        draw_tile(18, level_data.pipes[i][0], k);
        draw_tile(19, level_data.pipes[i][0] + 1, k);
      }
      else{
        end_pipe = true;
        pipes_state[i].y_base = k * 32;
        break;
      }
    }
    
    // Draw pipe top
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

// Parse and draw map
var parse_draw_map = function(){
  for(j = 0; j < 20; j++){
    for(i = 0; i < 40; i++){
      
      // Current tile
      drawn_tile = level_data.tiles[j][i];
      
      // Tile #12: cube (register it in level_data.cubes and remove it from the tiles)
      if(drawn_tile == 12 && frame == 0){
        level_data.cubes.push({x: i * 32, y: j * 32, vy: 0, mario: null});
        drawn_tile = 0;
        level_data.tiles[j][i] = 0;
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
  
  // Reset weights of Mario, cubes and balances
  current_mario.weight = 1;
  
  for(i in level_data.cubes){
    level_data.cubes[i].weight = 1;
  }
  
  for(i in level_data.balances){
    balances_state[i].weight1 = 0;
    balances_state[i].weight2 = 0;
  }
}


// Apply gravity and collisions to a given object (mario or cube)
var gravity_and_collisions = function(obj, obj_width){
  
  
  // Stop going right if there's a solid tile or the end of the screen on the right
  if(
    is_solid(tile_at(obj.x + obj_width, obj.y))
    ||
    is_solid(tile_at(obj.x + obj_width, obj.y + 31))
  ){
    obj.x = ~~(obj.x / 32) * 32 + 32 - obj_width - 1;
  }
  if(obj.x > 1280 - obj_width){
    obj.x = 1280 - obj_width;
    obj.state = 0;
  }
  
  // Stop going right if there's a pipe there
  for(var j in level_data.pipes){
    if(
      obj.x + obj_width >= level_data.pipes[j][0] * 32
      &&
      obj.x + obj_width <= level_data.pipes[j][0] * 32 + 16
      &&
      obj.y + 31 >= pipes_state[j].y
      &&
      obj.y <= pipes_state[j].y_base
    ){
      obj.x = level_data.pipes[j][0] * 32 - obj_width - 1;
    }
  }
  
  
  // Stop going left if there's a solid tile or end of the level on the left
  if(
    is_solid(tile_at(obj.x, obj.y))
    ||
    is_solid(tile_at(obj.x, obj.y + 31))
  ){
    obj.x = ~~(obj.x / 32) * 32 + 32;
  }
  if(obj.x < 0){
    obj.x = 0;
    obj.state = 0;
  }
  
  // Stop going left if there's a pipe there
  for(j in level_data.pipes){
    if(
      obj.x >= level_data.pipes[j][0] * 32 + 64 - 16
      &&
      obj.x <= level_data.pipes[j][0] * 32 + 64
      &&
      obj.y + 31 >= pipes_state[j].y
      &&
      obj.y <= pipes_state[j].y_base
    ){
      obj.x = level_data.pipes[j][0] * 32 + 64;
    }
  }
  
  // Apply gravity
  obj.grounded = false;
  obj.vy += gravity;
  if(obj.vy > max_fall_speed){
    obj.vy = max_fall_speed;
  }
  obj.y += obj.vy;
  
  // Press yellow switch
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
  
  // compute object's weight
  if(obj.cube_held !== null){
    obj.weight = 1 + level_data.cubes[obj.cube_held].weight;
  }
  
  // If object actually falls
  if(obj.vy > 0){
    
    // Stop falling if a solid tile is under object
    if(
      is_solid(tile_at(obj.x, obj.y + 32))
      ||
      is_solid(tile_at(obj.x + obj_width, obj.y + 32))
    ){
      obj.y = ~~(obj.y / 32) * 32;
      obj.vy = 0;
      obj.grounded = true;
    }
    
    // Stop falling if a cube is under object
    for(i in level_data.cubes){
      if(
        obj.x + obj_width > level_data.cubes[i].x
        &&
        obj.x < level_data.cubes[i].x + 31
        &&
        obj.y + 31 > level_data.cubes[i].y - 8
        &&
        obj.y + 31 < level_data.cubes[i].y + 20
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
        obj.y + 31 >= pipes_state[j].y
        &&
        obj.y + 31 <= pipes_state[j].y + 32
      ){
        obj.y = pipes_state[j].y - 32;
        obj.vy = 0;
        obj.grounded = true;
      }
    }
    
    // Stop falling if there's a balance "1" there
    for(j in level_data.balances){
      if(
        obj.x + obj_width >= level_data.balances[j][0] * 32 - 32
        &&
        obj.x < level_data.balances[j][0] * 32 + 64
        &&
        obj.y + 31 >= balances_state[j].y1 - 8
        &&
        obj.y + 31 <= balances_state[j].y1 + 32
      ){
        obj.y = balances_state[j].y1 - 32;
        obj.vy = 0;
        obj.grounded = true;
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
        obj.y + 31 >= balances_state[j].y2 - 8
        &&
        obj.y + 31 <= balances_state[j].y2 + 32
      ){
        obj.y = balances_state[j].y2 - 32;
        obj.vy = 0;
        obj.grounded = true;
        balances_state[j].weight2 += obj.weight;
      }
    }
  }
  
  // Stop going up if there's a solid tile on top
  if(
    is_solid(tile_at(current_mario.x, current_mario.y))
    ||
    is_solid(tile_at(current_mario.x + mario_width, current_mario.y))
  ){
    
    // Break bricks (tile #5)
    if(tile_at(current_mario.x, current_mario.y) == 5){
      set_tile(current_mario.x, current_mario.y, 0);
    }
    if(tile_at(current_mario.x + mario_width, current_mario.y) == 5){
      set_tile(current_mario.x + mario_width, current_mario.y, 0);
    }
    
    current_mario.y = ~~((current_mario.y) / 32) * 32 + 32;
    current_mario.vy = 0;
  }
}