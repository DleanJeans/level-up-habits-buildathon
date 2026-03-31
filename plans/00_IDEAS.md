0. React Native. Local-first. Platform: Web only. Use pnpm (volta).

1. Habits can be a checkbox, numeral or time-based.
    - Checkbox gives a fixed number of stars (user-set).
    - Example: Brush teeth, Take meds

2. Numeral habits also give stars based on user customization from 1 to 3 stars, optionally can give more stars based on extra. Has unit: string set by user (mins, sets, words)
    - Example 1: Meditate, 2 mins = 1 star, 5 mins = 2 stars, 10 mins = 3 stars, every extra 10 mins give 1 more star
    - Example 2: Eat meals, 1 meal = 1 star, 2 meal = 2 stars, 3 meals = 3 stars, more meals don't give any star

3. Time-based habit give stars based on the time frames.
Example: Shower, 3-9 PM = 3 stars, 6-3 PM = 2 stars, other time frames = 1 star

4. These are daily habits which accumulate stars for a day entry, which can be graphed to compare stars from day to day.

5. The app also supports one-off task/to-do list which gives stars set by the players.

Later, we'll add more advanced properties for habits like cues, routines, rewards and values based on Atomic Habits book.

6. Bad habits will subtract stars from a day

7. Habit cues can be location, mood, time. If time is within 5 minutes of another habit, that habit can be set as a cue.

8. A timelime/vertical log of habits 

9. Habit also have a type for daily/weekly/monthly/yearly.
Weekly and above habits don't count towards daily total stars and so on.
Weekly stars = 7 daily total stars + weekly habit stars. And so on.

10. A reminder feature with optional delay, this is user config, not automated
    - Example 1: After checking in and logging Wake up, app will remind to Brush teeth
    - Example 2: After logging Lunch habit, app will remind after a set duration (10 minutes) to take supplements

11. Auto tracking app opening (e.g. social media apps) to block and show an overlay asking if user wanna to proceed at a cost of losing stars, if yes, auto log habit and subtract stars

12. Habit log give stars both for starting the habit and any extra minutes set by the user.
    - Example: Mediatation - starting gives one star, user set 1 star per 10 minutes, first 10 minutes gives nothing, at 20 minute mark user gets 1 extra star.

13. Stars can be floating point, down to 0.05 minimum increments

14. Users can log mood/emotions/feelings/location as cues. Users can also set desired routines for a set cue. When users log such cue, the app will show the set routines as reminder for the users to pick from, and can log the outcome (changed mood/emotions/feelings) after.
    - Example: cue is feeling bad, routine can be quick workout, go to the beach, watch a movie, start music.