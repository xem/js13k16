
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
    c.fillText(level_data.txt || "", 640, 80);
  }
  
  // Save keys being pressed (for latest hero only)
  if(current_hero.keyleft){
    current_hero.left[frame] = true;
  }
  if(current_hero.keyright){
    current_hero.right[frame] = true;
  }
  if(current_hero.keyup){
    current_hero.up[frame] = true;
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
  for(hero in heros){
    play_hero(heros[hero], 1);
  }
  
  if(heros.length){
    hero = -1;
  }
  else{
    hero = 0;
  }
  
  // Play current hero
  play_hero(current_hero);
  
  // Move and draw cubes
  move_cubes();
    
  // Draw previous heros
  for(hero in heros){
    draw_hero(heros[hero], 1);
  }
  
  // Draw current hero
  draw_hero(current_hero);
  
  // Draw tiles that have portals, and portals in foreground
  draw_portals();
  
  // Mechanisms
  // ==========
  
  // Update mechanisms (yellow toggles / balances)
  update_mechanisms();
  
  // Next frame
  frame++;
  
  // Chrono
  if(!win){
    chrono++;
  }
  
  //document.title = frame;
  //document.title = heros[0].pickdrop;
  
  // Victoty animation (if we won) / Game over animation (if we lose)
  victory_or_defeat();
}
