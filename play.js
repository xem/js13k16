// Game loop
var play = () => {

  // Reset canvas
  a.width ^= 0;
  
  // Draw exit button
  c.font = "bold 30px arial";
  c.fillStyle = "#000";
  c.fillText("×", 1255, 25);
  
  // Pixelize graphics
  c.mozImageSmoothingEnabled = false;
  c.imageSmoothingEnabled = false;
  
  // First frame: build map
  if(frame == 0){
    level_data.tiles = [];
    for(j = 0; j < 20; j++){
      level_data.tiles[j] = [];
      for(i = 0; i < 40; i++){
        level_data.tiles[j][i] = level_data.hash.charCodeAt(j * 40 + i) - 0x30;
      }
    }
  }
  
  // Init pipes states (on first frame)
  if(frame == 0){
    for(i in level_data.pipes){
      pipes_state[i] = {pressed: false, y: level_data.pipes[i][1] * 32};
    }
  }
  
  // Pipes
  for(i in level_data.pipes){
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
    for(k = ~~(pipes_state[i].y / 32) + 1; k < 21; k++){
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
    
    // Switch
    if(level_data.pipes[i][4]){
      
      if(pipes_state[i].pressed){
        draw_tile(21, level_data.pipes[i][3], level_data.pipes[i][4]);
      }
      else{
        draw_tile(20, level_data.pipes[i][3], level_data.pipes[i][4]);
      }
    }
  }
  
  // Draw map
  for(j = 0; j < 20; j++){
    for(i = 0; i < 40; i++){
      
      drawn_tile = level_data.tiles[j][i];
      
      // Tile #12: cube
      if(drawn_tile == 12 && frame == 0){
        level_data.cubes.push({x: i * 32, y: j * 32, vy: 0, mario: null});
        drawn_tile = 0;
        level_data.tiles[j][i] = 0;
      }
      
      draw_tile(drawn_tile, i, j);

      // Special cases

      // Tile #2: draw & save flag pole
      if(drawn_tile == 2){
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
      
      // Tile #23: starting point coordinates
      if(drawn_tile == 23){
        level_data.start = [i, j];
      }
    }
  }
  
  // Reset yellow toggle
  yellow_toggle = false;
  for(j = 0; j < 20; j++){
    for(i = 0; i < 40; i++){
      if(level_data.tiles[j][i] == 25){
        level_data.tiles[j][i] = 11;
      }
    }
  }
  
  // Reset green switches
  for(i in level_data.pipes){
    pipes_state[i].pressed = false;
  }
  
  // Init Mario (on first frame)
  if(frame == 0){
    current_mario.x = level_data.start[0] * 32;
    current_mario.y = level_data.start[1] * 32;
  }
  
  // Move mario
  // ----------
  
  // If not dead and didn't win
  if(current_mario.state != 3 && !win){
    
    // Idle
    current_mario.state = 0;
    
    // Right
    if(current_mario.right){
      current_mario.keyright[frame] = true;
      current_mario.x += walk_speed;
      current_mario.direction = 1;
      if(current_mario.grounded){
        current_mario.state = 1;
      }
      
      // Stop going right if there's a solid tile or the end of the screen on the right
      if(
        is_solid(tile_at(current_mario.x + mario_width, current_mario.y))
        ||
        is_solid(tile_at(current_mario.x + mario_width, current_mario.y + 31))
      ){
        current_mario.x = ~~(current_mario.x / 32) * 32 + 32 - mario_width - 1;
      }
      if(current_mario.x > 1280 - mario_width){
        current_mario.x = 1280 - mario_width;
        current_mario.state = 0;
      }
      
      // Stop going right if there's a pipe there
      for(j in level_data.pipes){
        if(
          current_mario.x + mario_width >= level_data.pipes[j][0] * 32
          &&
          current_mario.x + mario_width <= level_data.pipes[j][0] * 32 + 16
          &&
          current_mario.y + 31 >= pipes_state[j].y
          &&
          current_mario.y <= pipes_state[j].y_base
        ){
          current_mario.x = level_data.pipes[j][0] * 32 - mario_width - 1;
        }
      }
    }
    
    // Left
    if(current_mario.left){
      current_mario.keyleft[frame] = true;
      current_mario.x -= walk_speed;
      current_mario.direction = 0;
      if(current_mario.grounded){
        current_mario.state = 1;
      }
      
      // Stop going left if there's a solid tile or end of the level on the left
      if(
        is_solid(tile_at(current_mario.x, current_mario.y))
        ||
        is_solid(tile_at(current_mario.x, current_mario.y + 31))
      ){
        current_mario.x = ~~(current_mario.x / 32) * 32 + 32;
      }
      if(current_mario.x < 0){
        current_mario.x = 0;
        current_mario.state = 0;
      }
      
      // Stop going left if there's a pipe there
      for(j in level_data.pipes){
        if(
          current_mario.x >= level_data.pipes[j][0] * 32 + 64 - 16
          &&
          current_mario.x <= level_data.pipes[j][0] * 32 + 64
          &&
          current_mario.y + 31 >= pipes_state[j].y
          &&
          current_mario.y <= pipes_state[j].y_base
        ){
          current_mario.x = level_data.pipes[j][0] * 32 + 64;
        }
      }
    }
    
    // Apply gravity
    current_mario.grounded = false;
    current_mario.vy += gravity;
    if(current_mario.vy > max_fall_speed){
      current_mario.vy = max_fall_speed;
    }
    current_mario.y += current_mario.vy;
    
    // Press yellow switch
    if(tile_at(current_mario.x, current_mario.y + 20) == 11){
      set_tile(current_mario.x, current_mario.y + 20, 25);
      yellow_toggle = true;
    }
    else if(tile_at(current_mario.x + mario_width, current_mario.y + 20) == 11){
      set_tile(current_mario.x + mario_width, current_mario.y + 20, 25);
      yellow_toggle = true;
    }
    
    // Press green switch
    for(i in level_data.pipes){
      
      if(
        current_mario.x + mario_width >= level_data.pipes[i][3] * 32
        &&
        current_mario.x <= level_data.pipes[i][3] * 32 + 32
        &&
        current_mario.y + 32 >= level_data.pipes[i][4] * 32
        &&
        current_mario.y + 20 <= level_data.pipes[i][4] * 32 + 32
      ){
        pipes_state[i].pressed = true;
      }
      
    }
    
    // If Mario actually falls
    if(current_mario.vy > 0){
      
      // Stop falling if a solid tile is under Mario
      if(
        is_solid(tile_at(current_mario.x, current_mario.y + 32))
        ||
        is_solid(tile_at(current_mario.x + mario_width, current_mario.y + 32))
      ){
        current_mario.y = ~~(current_mario.y / 32) * 32;
        current_mario.vy = 0;
        current_mario.grounded = true;
      }
      
      // Stop falling if a cube is under mario
      for(i in level_data.cubes){
        if(
          current_mario.x + mario_width > level_data.cubes[i].x
          &&
          current_mario.x < level_data.cubes[i].x + 31
          &&
          current_mario.y + 31 > level_data.cubes[i].y
          &&
          current_mario.y + 31 < level_data.cubes[i].y + 20
        )
        {
          current_mario.y = level_data.cubes[i].y - 32;
          current_mario.vy = 0;
          current_mario.grounded = true;
          current_mario.cube_below = i;
          current_mario.position_on_cube = current_mario.x - level_data.cubes[i].x;
        }
      }
      
      // Stop falling if there's a pipe there
      for(j in level_data.pipes){
        console.log(current_mario.y, pipes_state[j].y);
        if(
          current_mario.x + mario_width >= level_data.pipes[j][0] * 32
          &&
          current_mario.x < level_data.pipes[j][0] * 32 + 64
          &&
          current_mario.y + 31 >= pipes_state[j].y
          &&
          current_mario.y + 31 <= pipes_state[j].y + 32
        ){
          current_mario.y = pipes_state[j].y - 32;
          current_mario.vy = 0;
          current_mario.grounded = true;
        }
      }
    }
    
    // Jump
    if(current_mario.up && current_mario.grounded && current_mario.can_jump){
      current_mario.keyup[frame] = true;
      current_mario.vy -= jump_speed;
      current_mario.grounded = false;
      current_mario.can_jump = false;
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
    
    // Jump animation
    if(current_mario.vy < 0 && !current_mario.grounded){
      current_mario.state = 2;
    }
    
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
      }
    }
    
    // Move held cube with mario
    if(current_mario.cube_held !== null){
      level_data.cubes[current_mario.cube_held].x = current_mario.x + (current_mario.direction * -1) * 8;
      
      // Animate cube grab (make it last 5 frames)
      if(current_mario.pick_cube_animation_frame){
        current_mario.pick_cube_animation_frame--;
      }
      
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
      }
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
  
  // Make cubes fall if they're not held
  for(i in level_data.cubes){
    
    // Cubes can press yellow switch
    if(tile_at(level_data.cubes[i].x, level_data.cubes[i].y + 20) == 11){
      set_tile(level_data.cubes[i].x, level_data.cubes[i].y + 20, 25);
      yellow_toggle = true;
    }
    else if(tile_at(level_data.cubes[i].x + 32, level_data.cubes[i].y + 20) == 11){
      set_tile(level_data.cubes[i].x + 32, level_data.cubes[i].y + 20, 25);
      yellow_toggle = true;
    }
    
    // Cubes can press green switch
    for(j in level_data.pipes){
      if(
        level_data.cubes[i].x + 32 >= level_data.pipes[j][3] * 32
        &&
        level_data.cubes[i].x <= level_data.pipes[j][3] * 32 + 32
        &&
        level_data.cubes[i].y + 32 >= level_data.pipes[j][4] * 32
        &&
        level_data.cubes[i].y + 20 <= level_data.pipes[j][4] * 32 + 32
      ){
        pipes_state[j].pressed = true;
      }
    }
    
    if(level_data.cubes[i].mario === null){
      level_data.cubes[i].vy += gravity;
      if(level_data.cubes[i].vy > max_fall_speed){
        level_data.cubes[i].vy = max_fall_speed;
      }
      level_data.cubes[i].y += level_data.cubes[i].vy;
    
      // Stop falling if a solid tile or spike is under
      if(
        is_solid(tile_at(level_data.cubes[i].x, level_data.cubes[i].y + 32), 1)
        ||
        is_solid(tile_at(level_data.cubes[i].x + 32, level_data.cubes[i].y + 32), 1)
      ){
        level_data.cubes[i].y = ~~(level_data.cubes[i].y / 32) * 32;
        level_data.cubes[i].vy = 0;
      }
      
      // Stop falling if a cube is under
      for(j in level_data.cubes){
        if(j != i){
          if(
            level_data.cubes[i].x + 32 >= level_data.cubes[j].x
            &&
            level_data.cubes[i].x <= level_data.cubes[j].x + 31
            &&
            level_data.cubes[i].y + 31 >= level_data.cubes[j].y
            &&
            level_data.cubes[i].y + 31 <= level_data.cubes[j].y + 20
          )
          {
            level_data.cubes[i].y = level_data.cubes[j].y - 32;
            level_data.cubes[i].vy = 0;
            level_data.cubes[i].grounded = true;
            level_data.cubes[i].cube_below = j;
            level_data.cubes[i].position_on_cube = level_data.cubes[i].x - level_data.cubes[j].x;
          }
        }
      }
      
      // Stop falling if there's a pipe under
      for(j in level_data.pipes){
        if(
          level_data.cubes[i].x + 32 >= level_data.pipes[j][0] * 32
          &&
          level_data.cubes[i].x < level_data.pipes[j][0] * 32 + 64
          &&
          level_data.cubes[i].y + 31 >= pipes_state[j].y
          &&
          level_data.cubes[i].y + 31 <= pipes_state[j].y + 32
        ){
          level_data.cubes[i].y = pipes_state[j].y - 32;
          level_data.cubes[i].vy = 0;
          level_data.cubes[i].grounded = true;
        }
      }
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
  
  // Apply yellow toggle
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
  
  // First levels: add text
  if(level == 1 && last_screen == 1){
    c.font = "bold 30px arial";
    c.fillStyle = "black";
    c.textAlign = "center";
    c.fillText("Move with arrow keys or WASD or ZQSD.", 640, 80);
    c.fillText("Pick and drop cubes with [space]. Restart with R.", 640, 120);
    c.fillText("Collect all coins and reach the flag.", 640, 160);
  }
  
  // Next frame
  frame++;
  
  //requestAnimationFrame(play);
  
  //document.title = frame + " " + tile_at(current_mario.x + mario_width, current_mario.y + 30);
  
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
