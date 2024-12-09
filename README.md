# Todo

## **Game Board Design**

- [ ] Create reusable SVG components for cards

## **Game Logic Implementation**

- [ ] Define the game state structure
  - [ ] Direction, game status
- [ ] Implement card mechanics
  - [ ] Playing cards (matching by color, number, or symbol)
  - [ ] Handle action card effects (skip, reverse, draw two, wild, etc.)
- [ ] Implement turn management
  - [ ] Handle direction changes
- [ ] Implement UNO call logic
  - [ ] Allow players to call "UNO" when they have one card left
  - [ ] Apply penalties for failing to call "UNO"

## **Real-Time Game Updates**

- [ ] Use WebSockets to synchronize game state between players
- [ ] Send real-time updates for moves made and state changes
- [ ] Handle game events such as card plays, draws, UNO calls, and game conclusion

## **Security Measures**

- [ ] Validate and sanitize all user inputs on the server side
- [ ] Use prepared statements with parameterized queries throughout the application

## **Game Conclusion and Post-Game Flow**

- [ ] Implement win detection logic
- [ ] Update game status to 'finished' in the database
- [ ] Notify both players when the game ends
- [ ] Display game result and summary
- [ ] Provide option for players to return to the lobby
- [ ] Update player statuses to make them available in the lobby again

## **Deployment**

- [ ] Set up the deployment environment on Solace or another server
- [ ] Configure environment variables and production settings
- [ ] Migrate the production database schema
- [ ] Ensure secure and efficient database connections
- [ ] Perform end-to-end testing in the deployed environment
- [ ] Monitor application logs for errors or issues

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

## **Potential Enhancements (Optional for Extra Credit)**

- [ ] Implement additional features
  - [ ] Game statistics or leaderboards
- [ ] Add enhanced user experience features
  - [ ] Sound effects
  - [ ] Themed card designs
  - [ ] Screen reader support
- [ ] Implement a surprise element to exceed expectations!
