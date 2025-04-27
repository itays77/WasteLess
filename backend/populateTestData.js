// Plain JavaScript version - No TypeScript syntax
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');

// Load environment variables
dotenv.config();

// Define schemas directly in this file to avoid path issues
const ingredientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'dry',
        'vegetable',
        'fruit',
        'dairy',
        'meat',
        'frozen',
        'bakery',
        'other',
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      default: 'unit',
    },
    expiryDate: {
      type: Date,
      // Only required for non-dry ingredients
    },
    aboutToExpire: {
      type: Boolean,
      default: false,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    // For any additional details like brand, notes, etc.
    additionalInfo: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
});

// Add indices
ingredientSchema.index({ userId: 1, category: 1 });

// Create or get models
let Ingredient, User;
try {
  Ingredient = mongoose.model('Ingredient');
  console.log('Using existing Ingredient model');
} catch (e) {
  Ingredient = mongoose.model('Ingredient', ingredientSchema);
  console.log('Created new Ingredient model');
}

try {
  User = mongoose.model('User');
  console.log('Using existing User model');
} catch (e) {
  User = mongoose.model('User', userSchema);
  console.log('Created new User model');
}

// Ingredient category enum
const IngredientCategory = {
  DRY: 'dry',
  VEGETABLE: 'vegetable',
  FRUIT: 'fruit',
  DAIRY: 'dairy',
  MEAT: 'meat',
  FROZEN: 'frozen',
  BAKERY: 'bakery',
  OTHER: 'other',
};

// MongoDB connection
async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_CONNECTION_STRING);

    if (!process.env.MONGODB_CONNECTION_STRING) {
      throw new Error(
        'MONGODB_CONNECTION_STRING is not defined in environment variables'
      );
    }

    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Realistic ingredient names for each category
const ingredientData = {
  [IngredientCategory.DRY]: [
    'White Rice',
    'Brown Rice',
    'Quinoa',
    'Pasta',
    'Spaghetti',
    'Penne',
    'Fettuccine',
    'Flour',
    'Sugar',
    'Brown Sugar',
    'Salt',
    'Black Pepper',
    'Paprika',
    'Cumin',
    'Coriander',
    'Turmeric',
    'Cinnamon',
    'Nutmeg',
    'Dried Basil',
    'Dried Oregano',
    'Dried Thyme',
    'Bay Leaves',
    'Red Lentils',
    'Green Lentils',
    'Chickpeas',
    'Black Beans',
    'Kidney Beans',
    'Rolled Oats',
    'Cornmeal',
    'Couscous',
    'Bread Crumbs',
    'Rice Noodles',
    'Baking Powder',
    'Baking Soda',
    'Cocoa Powder',
    'Vanilla Extract',
    'Honey',
    'Maple Syrup',
    'Soy Sauce',
    'Olive Oil',
    'Vegetable Oil',
    'Canola Oil',
    'Coconut Oil',
    'Sesame Oil',
    'Vinegar',
    'Balsamic Vinegar',
    'Rice Vinegar',
    'Apple Cider Vinegar',
    'Ketchup',
    'Mustard',
    'Mayonnaise',
  ],
  [IngredientCategory.VEGETABLE]: [
    'Onion',
    'Garlic',
    'Carrot',
    'Celery',
    'Bell Pepper',
    'Tomato',
    'Potato',
    'Sweet Potato',
    'Zucchini',
    'Eggplant',
    'Broccoli',
    'Cauliflower',
    'Spinach',
    'Kale',
    'Lettuce',
    'Cabbage',
    'Red Cabbage',
    'Brussels Sprouts',
    'Asparagus',
    'Green Beans',
    'Mushroom',
    'Corn',
    'Cucumber',
    'Radish',
    'Bok Choy',
    'Green Onion',
    'Leek',
    'Artichoke',
    'Beetroot',
    'Turnip',
    'Parsnip',
    'Pumpkin',
    'Butternut Squash',
    'Acorn Squash',
    'Avocado',
    'Arugula',
  ],
  [IngredientCategory.FRUIT]: [
    'Apple',
    'Banana',
    'Orange',
    'Lemon',
    'Lime',
    'Grapefruit',
    'Strawberry',
    'Blueberry',
    'Raspberry',
    'Blackberry',
    'Grape',
    'Watermelon',
    'Cantaloupe',
    'Honeydew Melon',
    'Pineapple',
    'Mango',
    'Papaya',
    'Kiwi',
    'Peach',
    'Plum',
    'Nectarine',
    'Apricot',
    'Cherry',
    'Pear',
    'Passion Fruit',
    'Dragon Fruit',
    'Pomegranate',
    'Fig',
    'Date',
    'Coconut',
    'Cranberry',
    'Guava',
  ],
  [IngredientCategory.DAIRY]: [
    'Milk',
    'Whole Milk',
    'Skim Milk',
    'Almond Milk',
    'Soy Milk',
    'Oat Milk',
    'Coconut Milk',
    'Heavy Cream',
    'Half and Half',
    'Yogurt',
    'Greek Yogurt',
    'Butter',
    'Ghee',
    'Cheddar Cheese',
    'Mozzarella Cheese',
    'Parmesan Cheese',
    'Feta Cheese',
    'Goat Cheese',
    'Blue Cheese',
    'Cream Cheese',
    'Cottage Cheese',
    'Ricotta Cheese',
    'Swiss Cheese',
    'Brie',
    'Gouda',
    'Sour Cream',
    'Buttermilk',
  ],
  [IngredientCategory.MEAT]: [
    'Chicken Breast',
    'Chicken Thigh',
    'Whole Chicken',
    'Ground Beef',
    'Beef Steak',
    'Beef Ribs',
    'Pork Chop',
    'Pork Tenderloin',
    'Bacon',
    'Ham',
    'Ground Turkey',
    'Turkey Breast',
    'Lamb Chop',
    'Ground Lamb',
    'Sausage',
    'Salami',
    'Pepperoni',
    'Hot Dog',
    'Prosciutto',
    'Chorizo',
    'Duck Breast',
    'Liver',
    'Meatball',
  ],
  [IngredientCategory.FROZEN]: [
    'Frozen Peas',
    'Frozen Corn',
    'Frozen Broccoli',
    'Frozen Spinach',
    'Frozen Mixed Vegetables',
    'Frozen Berries',
    'Frozen Strawberries',
    'Frozen Mango',
    'Frozen Pizza',
    'Frozen French Fries',
    'Ice Cream',
    'Frozen Yogurt',
    'Frozen Fish Fillets',
    'Frozen Shrimp',
    'Frozen Chicken Nuggets',
    'Frozen Waffles',
    'Frozen Dumplings',
    'Frozen Edamame',
  ],
  [IngredientCategory.BAKERY]: [
    'Bread',
    'White Bread',
    'Whole Wheat Bread',
    'Sourdough Bread',
    'Baguette',
    'Pita Bread',
    'Tortilla',
    'Croissant',
    'Bagel',
    'English Muffin',
    'Dinner Roll',
    'Hamburger Bun',
    'Hot Dog Bun',
    'Naan',
    'Focaccia',
    'Ciabatta',
    'Pretzel',
    'Brioche',
    'Danish',
    'Muffin',
    'Cupcake',
    'Donut',
    'Cookie',
    'Brownie',
    'Cake',
  ],
  [IngredientCategory.OTHER]: [
    'Tofu',
    'Tempeh',
    'Eggs',
    'Honey',
    'Maple Syrup',
    'Peanut Butter',
    'Almond Butter',
    'Jam',
    'Nutella',
    'Hummus',
    'Salsa',
    'Guacamole',
    'Olive',
    'Pickle',
    'Canned Tomato',
    'Canned Tuna',
    'Canned Salmon',
    'Canned Corn',
    'Canned Bean',
    'Broth',
    'Stock',
    'Wine',
    'Beer',
    'Coffee',
    'Tea',
    'Chocolate',
    'Seaweed',
  ],
};

// Generate units based on category
function getUnitForCategory(category) {
  switch (category) {
    case IngredientCategory.DRY:
      return faker.helpers.arrayElement(['cup', 'g', 'kg', 'tbsp', 'package']);
    case IngredientCategory.VEGETABLE:
    case IngredientCategory.FRUIT:
      return faker.helpers.arrayElement(['piece', 'kg', 'g', 'lb', 'bunch']);
    case IngredientCategory.DAIRY:
      return faker.helpers.arrayElement(['cup', 'ml', 'l', 'tbsp', 'package']);
    case IngredientCategory.MEAT:
      return faker.helpers.arrayElement(['piece', 'kg', 'g', 'lb']);
    case IngredientCategory.FROZEN:
      return faker.helpers.arrayElement(['package', 'g', 'kg', 'piece']);
    case IngredientCategory.BAKERY:
      return faker.helpers.arrayElement(['piece', 'loaf', 'slice', 'package']);
    case IngredientCategory.OTHER:
      return faker.helpers.arrayElement([
        'piece',
        'unit',
        'can',
        'package',
        'cup',
      ]);
  }
}

// Function to generate a random ingredient
async function createRandomIngredient(userId, index) {
  const categories = Object.values(IngredientCategory);
  const category = faker.helpers.arrayElement(categories);

  // Select ingredient name from the appropriate category
  const name = faker.helpers.arrayElement(ingredientData[category]);

  // Determine if this ingredient should be marked as about to expire
  // We want exactly 40 ingredients to be about to expire (20% of 200)
  const isAboutToExpire = index < 40;

  // Generate expiry date (if not dry goods)
  let expiryDate = null;
  if (category !== IngredientCategory.DRY) {
    if (isAboutToExpire) {
      // About to expire: 1-7 days from now
      expiryDate = faker.date.soon({ days: 7 });
    } else {
      // Not about to expire: 8-30 days from now
      expiryDate = faker.date.future({
        days: 30,
        refDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });
    }
  }

  const quantity = parseFloat(
    faker.number.float({ min: 0.1, max: 5, precision: 0.1 }).toFixed(1)
  );
  const unit = getUnitForCategory(category);

  return new Ingredient({
    userId,
    name,
    category,
    quantity,
    unit,
    expiryDate,
    aboutToExpire: isAboutToExpire,
    purchaseDate: faker.date.recent({ days: 14 }),
    additionalInfo: faker.helpers.maybe(() => faker.lorem.sentence(), {
      probability: 0.3,
    }),
  });
}

// Main function to populate the database
async function populateDatabase() {
  try {
    await connectToDatabase();

    // Check if test data already exists
    const existingIngredientsCount = await Ingredient.countDocuments();

    if (existingIngredientsCount > 50) {
      console.log('Test data appears to already exist in the database.');
      console.log(`Current count: ${existingIngredientsCount} ingredients`);

      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('Use --force flag to add more test data anyway.');
        process.exit(0);
      }
      console.log('Proceeding to add more test data (--force flag detected)');
    }

    // Retrieve a user ID to associate with the test data
    const user = await User.findOne();
    if (!user) {
      console.error(
        'No user found in the database. Please create a user first.'
      );
      process.exit(1);
    }

    console.log(`Using user ID: ${user._id} for test data`);
    const userId = user._id.toString();

    // Add 200 ingredients (40 about to expire)
    console.log('Adding 200 test ingredients...');
    const ingredientPromises = [];
    for (let i = 0; i < 200; i++) {
      const ingredient = await createRandomIngredient(userId, i);
      ingredientPromises.push(ingredient.save());

      // Log progress every 50 ingredients
      if ((i + 1) % 50 === 0) {
        console.log(`Created ${i + 1} ingredients...`);
      }
    }
    await Promise.all(ingredientPromises);
    console.log('Successfully added 200 ingredients!');

    const finalIngredientCount = await Ingredient.countDocuments();
    console.log(`Final database count: ${finalIngredientCount} ingredients`);
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the population script
populateDatabase();
