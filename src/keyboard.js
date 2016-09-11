// Keyboard input (during gameplay)
onkeydown = (e) => {
  if(screen == 2){
    
    // Top
    if(e.keyCode == 38 || e.keyCode == 90 || e.keyCode == 87){
      if(current_hero.can_jump){
        current_hero.keyup = true;
        current_hero.can_jump = false;
        keyup = true;
      }
    }
    
    // Right
    if(e.keyCode == 39 || e.keyCode == 68){
      current_hero.keyright = true;
      keyright = true;
    }
    
    // Left
    if(e.keyCode == 37 || e.keyCode == 65 ||e.keyCode == 81){
      current_hero.keyleft = true;
      keyleft = true;
    }
  }
}

onkeyup = (e) => {
  
  // During gameplay
  if(screen == 2){
    
    // Top
    if(e.keyCode == 38 || e.keyCode == 90 || e.keyCode == 87){
      current_hero.keyup = false;
      current_hero.can_jump = true;
      keyup = false;
    }
    
    // Right
    if(e.keyCode == 39 || e.keyCode == 68){
      current_hero.keyright = false;
      keyright = false;
    }
    
    // Left
    if(e.keyCode == 37 || e.keyCode == 65 || e.keyCode == 81){
      current_hero.keyleft = false;
      keyleft = false;
    }
    
    // R (reset)
    if(e.keyCode == 82){
      reset_current_level();
      chrono = 0;
    }
    
    // Space (press to toggle between pick cube and drop cube)
    if(e.keyCode == 32){
      current_hero.space[frame] = true;
    }
    
    // Shift 
    if(e.keyCode == 16){
      current_hero.shift[frame] = true;
    }
  }
}
