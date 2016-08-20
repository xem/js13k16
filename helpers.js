// Collection of helper functions often called

// Draw a 32x32 tile aligned on the grid
var draw_tile = (id, tile_x, tile_y) => {
  c.drawImage(tileset, id * 16, 0, 16, 16, tile_x * 32, 40 + tile_y * 32, 32, 32);
}

// Draw a 32x32 sprite anywhere (don't forget to add 40 to y to draw in the scened)
var draw_sprite = (id, x, y) => {
  c.drawImage(tileset, id * 16, 0, 16, 16, x, y, 32, 32);
}

// Which tile is at these coordinates (in px)? (0 by default)
var tile_at = (x, y) => {
  if(!level_data.tiles[~~(y / 32)]){
    return 0;
  }
  
  return level_data.tiles[~~(y / 32)][~~(x / 32)];
}

// Set a tile at these coordinates (in px)
var set_tile = (x, y, value) => {
  if(!level_data.tiles[~~(y / 32)]){
    return;
  }
  level_data.tiles[~~(y / 32)][~~(x / 32)] = value;
}

// Is a tile id currently solid? (and do spikes count or not?)
var is_solid = (id, spikes) => {
  return (spikes && id == 7) || solid[id] || 0;
}

// Is a tile writable (in the editor, a.k.a don't already contain a pipe or a balance or a time machine)
var is_writable = (tile_x, tile_y) => {
  if(!level_data.tiles[tile_y]){
    return 0;
  }
  return !level_data.tiles[tile_y][tile_x] || level_data.tiles[tile_y][tile_x] < 14 || level_data.tiles[tile_y][tile_x] > 24
}

// Reset all the settings of the current level (before playing / testing)
var reset_current_level = () => {
  
  // Reset win condition
  win = false;
  coins_left = 0;
  win_frame = 0;
  
  // Game loop
  //loop = 0;

  // Current frame
  frame = 0;

  // Current mario
  current_mario = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    grounded: 0,
    keyup: [],
    keyright: [],
    //keydown: [],
    keyleft: [],
    keyspace: [],
    direction: 1, // 0: left, 1: right
    state: 0, // 0: idle, 1: walking, 2: jumping, 3: dead
    cube_held: null,
    can_jump: true,
    cube_below: null,
    position_on_cube: null,
    pick_cube_animation_frame: 0
  }

  // Mario's width (not 32px in order to pass easily between two blocks)
  mario_width = 24;

  // Gravity (downwards acceleration):
  gravity = 2;

  // Max fall speed
  max_fall_speed = 20;

  // Jump speed (upwards vy force):
  jump_speed = 20;

  // Walk speed (horizontal vx)
  walk_speed = 6;

  // Solidity of the tiles (some of them vary during gameplay, sor reset it before each level and after reset)
  solid = [
    0, 
    0, 
    0, 
    1, 
    1, 
    1, 
    0, // 6: coin
    0, // 7: spike
    1, 
    1, 
    0,
    0, // 11: yellow toggle
    0, 
    1, 
    1, 
    0, // 15: Balance
    1, 
    1, 
    1, 
    1, 
    1, // 20: Green switch
    0, // 21: Green switch presed
    0, 
    0, 
    0, 
    0 // 25: yellow toggle pressed
  ];
  
  // Cubes
  level_data.cubes = [];
  
  // Yellow toggle
  yellow_toggle_last_frame = false;
  
  // Pipes state
  pipes_state = [];
  
  // Balances state
  balances_state = [];
}


// Make an empty level (for the editor)
var reset_maker_level = () => {
  
  // Editor's level data
  level_data = {
    tiles: [],
    pipes: [],
    balances: [],
    cubes: [],
    tested: false
  }

  for(j = 0; j < 20; j++){
    level_data.tiles[j] = [];
  }

  // Pipes
  pipe_click = 0;
  current_pipe = 0;

  // Balances
  balance_click = 0;
  current_balance = 0;
  
  // Current tile in the level editor (0: sky / 1: start / etc.)
  current_editor_tile = 0;
}
