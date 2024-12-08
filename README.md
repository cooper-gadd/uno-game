# Todo

## **Game Board Design**

- [ ] Design the game board layout using SVG
- [ ] Include card deck, discard pile, player hands, and game table
- [ ] Create reusable SVG components for cards
- [ ] Integrate SVG components into React
- [ ] Ensure interactivity (e.g., clicking cards to play them)
- [ ] Ensure the game board is responsive across browsers

---

## **Game Logic Implementation**

- [ ] Define the game state structure
  - [ ] Current player turn, direction, deck, discard pile, player hands, game status
- [ ] Implement card mechanics
  - [ ] Drawing cards from the deck
  - [ ] Playing cards (matching by color, number, or symbol)
  - [ ] Handle action card effects (skip, reverse, draw two, wild, etc.)
- [ ] Implement turn management
  - [ ] Enforce turn order and handle direction changes
  - [ ] Prevent players from making moves when it's not their turn
- [ ] Implement UNO call logic
  - [ ] Allow players to call "UNO" when they have one card left
  - [ ] Apply penalties for failing to call "UNO"
- [ ] Provide immediate feedback to players attempting illegal moves
- [ ] Implement option for players to end a game
  - [ ] Allow surrender or mutual agreement to end the game early

---

## **Real-Time Game Updates**

- [ ] Use WebSockets to synchronize game state between players
- [ ] Send real-time updates for moves made and state changes
- [ ] Handle game events such as card plays, draws, UNO calls, and game conclusion

---

## **Game State Persistence**

- [ ] Persist game state changes to the database after each turn
- [ ] Handle disconnections and reconnections
- [ ] Allow players to reload the page and resume the game seamlessly
- [ ] Restore game state from the database upon page reload

---

## **Security Measures**

- [ ] Validate and sanitize all user inputs on the server side
- [ ] Use prepared statements with parameterized queries throughout the application

---

## **Game Conclusion and Post-Game Flow**

- [ ] Implement win detection logic
- [ ] Update game status to 'finished' in the database
- [ ] Notify both players when the game ends
- [ ] Display game result and summary
- [ ] Provide option for players to return to the lobby
- [ ] Update player statuses to make them available in the lobby again
- [ ] Ensure players cannot chat with lobby members during a game and vice versa

---

## **UI Enhancements**

- [ ] Add visual feedback and animations
  - [ ] Animate card movements when played or drawn
  - [ ] Highlight the current player's turn clearly

---

## **Deployment**

- [ ] Set up the deployment environment on Solace or another server
- [ ] Configure environment variables and production settings
- [ ] Migrate the production database schema
- [ ] Ensure secure and efficient database connections
- [ ] Perform end-to-end testing in the deployed environment
- [ ] Monitor application logs for errors or issues

---

## **Presentation Preparation**

- [ ] Create a presentation outline
- [ ] Highlight key features and functionalities
- [ ] Prepare a demonstration
  - [ ] User registration and login process
  - [ ] Lobby interactions and chat
  - [ ] Gameplay mechanics and turn-taking
  - [ ] In-game chat and game conclusion
- [ ] Rehearse the presentation to fit within the 10-minute limit
- [ ] Anticipate possible questions and prepare responses

---

## **Potential Enhancements (Optional for Extra Credit)**

- [ ] Adapt the UI for mobile devices
  - [ ] Test touch interactions and adjust layouts
- [ ] Implement additional features
  - [ ] Player avatars or profile customization
  - [ ] Game statistics or leaderboards
  - [ ] Different game modes or rule variations
- [ ] Add enhanced user experience features
  - [ ] Sound effects
  - [ ] Themed card designs
  - [ ] Screen reader support
- [ ] Implement a surprise element to exceed expectations!

---
