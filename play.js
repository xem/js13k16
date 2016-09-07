
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
    c.fillText(
      [
        ,
        "Move with arrow keys or WASD or ZQSD. Collect all coins and reach the flag.", // 1
        "If you're stuck, restart with R.", // 2
        "Ice is slippy if you're not standing still.", // 3
        "Press space to hold and drop cubes. Jump and press space to throw them.", // 4
        ,
        ,
        ,
        "Aim with mouse, send portals with left click and right click.", // 8
        "Use momentum!", // 9
        ,
        "Need a little help from the past? Go to the time machine and press Shift!", // 11
        ,
        "Sometimes it's easier with multiple time travels...", // 13
        "If a past self dies or can't reach the time machine, it's a paradox! *wink wink theme*", // 14
      
      ][level] || "", 640, 80
    );
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
  
  //document.title = frame;
  
  // Victoty animation (if we won) / Game over animation (if we lose)
  victory_or_defeat();
}
