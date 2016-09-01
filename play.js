
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
        "",
        "Move with arrow keys or WASD or ZQSD. Collect all coins and reach the flag.",
        "If you're stuck, restart with R.",
        "Ice is slippy if you're not standing still.",
        "Hold and drop cubes with Space.",
        ,
        ,
        ,
        "Aim with mouse, send portals with left click and right click.",
        "Use momentum!",
      
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
    
    // TODO
    
  }
  
  // Play current hero
  
  play_hero(current_hero);
  
  // Move and draw cubes
  move_cubes();
    
  // Draw previous heros
  for(hero in heros){
    
    // TODO
    
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
  
  //document.title = frame + " " + current_hero.weight + " " + balances_state[0].weight1 + " " + balances_state[0].weight2 + " " + level_data.cubes[1].weight;
  //document.title = current_hero.x + " " + current_hero.y;
  
  // Victoty animation (if we won)
  victory();
}
