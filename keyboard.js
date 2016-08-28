// OK

// Keyboard input (during gameplay)
onkeydown = onkeypress = (e) => {
  if(screen == 2){
    
    // Top
    if(e.keyCode == 38 || e.keyCode == 90 ||e.keyCode == 87){
      current_mario.keyup = true;
    }
    
    // Right
    if(e.keyCode == 39 || e.keyCode == 68){
      current_mario.keyright = true;
    }
    
    // Left
    if(e.keyCode == 37 || e.keyCode == 65 ||e.keyCode == 81){
      current_mario.keyleft = true;
    }
  }
}

onkeyup = (e) => {
  
  // During gameplay
  if(screen == 2){
    
    // Top
    if(e.keyCode == 38 || e.keyCode == 90 || e.keyCode == 87){
      current_mario.keyup = false;
    }
    
    // Right
    if(e.keyCode == 39 || e.keyCode == 68){
      current_mario.keyright = false;
    }
    
    // Left
    if(e.keyCode == 37 || e.keyCode == 65 || e.keyCode == 81){
      current_mario.keyleft = false;
    }
    
    // R (reset)
    if(e.keyCode == 82){
      reset_current_level();
    }
    
    // Space (press to toggle)
    if(e.keyCode == 32){
      current_mario.space[frame] = true;
      current_mario.pickdrop ^= 1;
    }
  }
}
