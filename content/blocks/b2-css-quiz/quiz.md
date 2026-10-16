---
draw: 15
pass: 12
---

## --question--

### --text--

Which line connects a page to the stylesheet `css/style.css`?

### --distractors--

- `<a href="css/style.css">Styles</a>`
- `<style src="css/style.css">`
- `<script src="css/style.css"></script>`

### --answer--

`<link rel="stylesheet" href="css/style.css">`

### --explanation--

A `link` element in the `head` loads another file, and `rel="stylesheet"` says that the file is CSS. An `a` element makes a link that people click, a `style` element holds CSS written inside the page, and a `script` element loads JavaScript.

## --question--

### --text--

In the rule `h1 { color: #1f5c99; }`, what is `color`?

### --distractors--

- The selector
- The value
- The declaration

### --answer--

The property

### --explanation--

The selector is `h1`, the property is `color` and the value is `#1f5c99`. The whole line `color: #1f5c99;` is the declaration.

## --question--

### --text--

What ends every CSS declaration?

### --distractors--

- A comma
- A colon
- A closing tag

### --answer--

A semicolon

### --explanation--

A semicolon ends a declaration. Leave it out and the browser reads the next line as part of the same declaration, then drops both.

## --question--

### --text--

Which selector matches `<span class="badge">Urgent</span>`?

### --distractors--

- `#badge`
- `badge`
- `span.class`

### --answer--

`.badge`

### --explanation--

A dot in front of a name matches a class. A hash matches an id, and a bare `badge` matches an element called `badge`, which does not exist.

## --question--

### --text--

Which selector matches the one element with `id="complaints"`?

### --distractors--

- `.complaints`
- `complaints`
- `@complaints`

### --answer--

`#complaints`

### --explanation--

A hash matches an id, and an id belongs to one element only. A dot would look for a class.

## --question--

### --text--

What does the selector `h1, h2` match?

### --distractors--

- Only an `h2` that sits inside an `h1`
- Only the first `h1` or `h2` on the page
- Every element whose class is `h1` or `h2`

### --answer--

Every `h1` element and every `h2` element

### --explanation--

A comma lets one rule style several selectors. A space between two names, as in `h1 h2`, would mean an `h2` inside an `h1`.

## --question--

### --text--

Where do you define a CSS variable so that every rule can use it?

### --distractors--

- In a `var` element in the `head`
- Inside the `title` element
- In the `link` element that connects the stylesheet

### --answer--

In a `:root` rule

### --explanation--

`:root` matches the whole page, so a variable defined there is available everywhere. Define `--primary` once, then read it with `var(--primary)`.

## --question--

### --text--

How does the name of a CSS variable start?

### --distractors--

- With a dot
- With a hash
- With a dollar sign

### --answer--

With two hyphens

### --explanation--

Names such as `--primary` and `--urgent` start with two hyphens. A dot is for classes and a hash is for ids.

## --question--

### --text--

What does the declaration `color: var(--urgent);` do?

### --distractors--

- It defines a new variable called `--urgent`
- It sets the colour to the word `var`
- It makes the text red, whatever value `--urgent` holds

### --answer--

It sets the text colour to the value of `--urgent`

### --explanation--

`var()` is replaced by the value of the variable, so the text takes whatever colour `--urgent` holds. A variable is defined in `:root`, with two hyphens in front of its name.

## --question--

### --text--

Why put the IHMS palette in CSS variables?

### --distractors--

- HTML needs them before it can show colours
- They make the page load faster
- They stop other pages from changing the colours

### --answer--

You change a colour in one place and every rule that uses it follows

### --explanation--

A variable names a value once. It does not change the speed of the page, and HTML does not need CSS at all.

## --question--

### --text--

What is the advantage of sizing text in `rem` instead of pixels?

### --distractors--

- Text in `rem` loads faster than text in pixels
- CSS does not accept pixel sizes
- A `rem` is always larger than a pixel

### --answer--

A `rem` follows the browser's base text size, so it respects users who set larger text

### --explanation--

A `rem` is relative to the base text size of the browser. A pixel size stays fixed, whatever the user has chosen.

## --question--

### --text--

Which layer of the box model is the space between the content and the border?

### --distractors--

- Margin
- Border
- Content

### --answer--

Padding

### --explanation--

Padding is inside the border, around the content. Margin is the space outside the border.

## --question--

### --text--

A box has `width: 300px`, `padding: 20px` and a `5px` border, and the page has `* { box-sizing: border-box; }`. How wide is the box on the page?

### --distractors--

- 350px
- 340px
- 310px

### --answer--

300px

### --explanation--

With `border-box`, `width` already includes the padding and the border. Without it the box would be 350px: 300 plus 40 of padding plus 10 of border.

## --question--

### --text--

What does the `*` selector match?

### --distractors--

- Only the `body`
- Only elements that have a class
- Only the first element on the page

### --answer--

Every element

### --explanation--

`*` matches everything, so `* { box-sizing: border-box; }` changes how every box counts its width.

## --question--

### --text--

What does `max-width: 40rem` do to a card?

### --distractors--

- It makes the card exactly `40rem` wide on every screen
- It adds `40rem` of space outside the card
- It stops the card from shrinking on a phone

### --answer--

It stops the card growing wider than `40rem`, and still lets it shrink on a phone

### --explanation--

`max-width` sets a ceiling. On a narrow screen the card is narrower than the ceiling, so it fits.

## --question--

### --text--

How much space does `margin: 1rem 0` give?

### --distractors--

- `1rem` on all four sides
- `1rem` on the left and right, and none above and below
- `1rem` above the box only

### --answer--

`1rem` above and below, and none on the left and right

### --explanation--

With two values, the first is for the top and bottom, and the second is for the left and right.

## --question--

### --text--

Which declaration lays out the children of a `nav` in a row?

### --distractors--

- `display: row;`
- `flex-direction: row;` on its own
- `justify-content: row;`

### --answer--

`display: flex;`

### --explanation--

`display: flex` on the parent puts its children in a row. `flex-direction` only picks the direction once the parent is a flex container, and `row` is not a value of `display` or `justify-content`.

## --question--

### --text--

What does `flex-direction: column` do to the items of a flex container?

### --distractors--

- It puts them side by side in a row
- It pushes them to opposite ends of the row
- It moves them to a new line when there is no room

### --answer--

It stacks them one under another

### --explanation--

A column runs down the page instead of across it.

## --question--

### --text--

What does `justify-content: space-between` do in a flex row?

### --distractors--

- It bunches all the items in the middle
- It lines the items up across the row
- It adds space inside each item

### --answer--

It pushes the first item to the left and the last to the right, with the free space between them

### --explanation--

`justify-content` spreads the items along the row. `center` is the value that bunches them in the middle, and `align-items` lines them up across the row.

## --question--

### --text--

What does `flex-wrap: wrap` allow?

### --distractors--

- Items to shrink until they disappear
- Items to sit on top of each other
- The container to grow wider than the screen

### --answer--

Items to move to a new line when there is no room

### --explanation--

Without it, a flex row keeps every item on one line. With it, the nav links on a narrow screen can drop to a second line.

## --question--

### --text--

What does `repeat(auto-fit, minmax(12rem, 1fr))` do?

### --distractors--

- It makes exactly 12 columns
- It makes every column exactly `12rem` wide
- It repeats the first card twelve times

### --answer--

It fits as many columns at least `12rem` wide as there is room for

### --explanation--

`12rem` is the smallest a column can be, and `1fr` lets the columns share the spare space. The number of columns changes with the width of the screen.

## --question--

### --text--

Which layout job suits grid better than flexbox?

### --distractors--

- A row of navigation links
- A name on the left and a price on the right
- A column of items with space between them

### --answer--

A set of equal cards that fills as many columns as the screen allows

### --explanation--

Flexbox lays items out along one line. Grid lays them out in rows and columns together, which suits the admin summary cards.

## --question--

### --text--

What does the selector `nav a` match?

### --distractors--

- Every `nav` element and every `a` element
- A `nav` element inside an `a` element
- Only a `nav` element that has the class `a`

### --answer--

Every link inside the `nav`

### --explanation--

A space between two names means that the second is inside the first. A comma would mean either one.

## --question--

### --text--

When does a rule inside `@media (max-width: 600px)` apply?

### --distractors--

- Always
- Only when printing
- Only when the screen is exactly 600px wide

### --answer--

When the screen is 600px wide or less

### --explanation--

`max-width` is the widest screen the rule applies to. A phone 375px wide is narrower than 600px, so the rule applies.

## --question--

### --text--

What does the `meta` viewport line in the `head` do?

### --distractors--

- It makes the page load faster on a phone
- It hides the page on screens wider than 600px
- It links the page to `css/style.css`

### --answer--

It makes a phone use its real screen width

### --explanation--

Keep the line on every page. The `link` element is what connects the stylesheet.

## --question--

### --text--

A staff table is wider than a phone screen. How do you stop the whole page from scrolling sideways?

### --distractors--

- Set `flex-wrap: wrap` on the `table`
- Set `gap: 1rem` on the `table`
- Set `box-sizing: border-box` on the `table`

### --answer--

Put the table in a `div` and set `overflow-x: auto` on the `div`

### --explanation--

The table then scrolls sideways inside its box, and the page stays still.

## --question--

### --text--

Which element does `.badge.urgent` match?

### --distractors--

- `<span class="badge"><span class="urgent">`
- `<span class="urgent">`
- `<span id="badge" class="urgent">`

### --answer--

`<span class="badge urgent">`

### --explanation--

Two classes joined with no space match one element that has both classes. In the other options, the two names are on different elements, or `badge` is an id.

## --question--

### --text--

Why does the `.badge` rule use `display: inline-block`?

### --distractors--

- So that the badge fills the whole width of the row
- So that the badge becomes a flex container
- So that the badge is hidden on phones

### --answer--

So that the badge sits in a line of text and still keeps its padding

### --explanation--

`inline-block` lets a `span` stay in the line and still take the padding and the rounded corners.

## --question--

### --text--

What does the selector `tr.overdue` match?

### --distractors--

- Every `tr` element and every element with the class `overdue`
- A `tr` element inside an element that has the class `overdue`
- Every `td` inside a row

### --answer--

A `tr` element that has the class `overdue`

### --explanation--

A class written straight after an element name, with no space, means that element with that class. Both parts must be true.

## --question--

### --text--

When does the rule `a:hover` apply?

### --distractors--

- After a link has been visited
- While the keyboard has selected the link
- Only on a phone

### --answer--

While the pointer is over a link

### --explanation--

`:hover` depends on the pointer. A link the keyboard has selected matches `:focus`.

## --question--

### --text--

When does the rule `textarea:focus` apply?

### --distractors--

- While the pointer is over the field
- While the field is empty
- While the page loads

### --answer--

While the field is selected, for example by a click or by the keyboard

### --explanation--

`:focus` is the moment a field is selected. `:hover` is the one for the pointer.

## --question--

### --text--

Why should you never remove a focus outline without replacing it?

### --distractors--

- The outline makes the page load faster
- The browser stops showing the field
- Mouse users cannot click the field without it

### --answer--

Keyboard users need it to see where they are

### --explanation--

The outline shows which field is selected. If you take it away, add a clear one in its place.
