const Subject = require('../models/Subject');

const subjectsData = [
  {
    name: 'Mathematics',
    icon: 'Calculator',
    color: '#3B82F6',
    units: [
      { name: 'Unit 1: Algebra', durationMinutes: 60 },
      { name: 'Unit 2: Calculus', durationMinutes: 90 },
      { name: 'Unit 3: Geometry', durationMinutes: 45 },
    ],
  },
  {
    name: 'Physics',
    icon: 'Atom',
    color: '#EF4444',
    units: [
      { name: 'Unit 1: Mechanics', durationMinutes: 60 },
      { name: 'Unit 2: Thermodynamics', durationMinutes: 60 },
      { name: 'Unit 3: Electromagnetism', durationMinutes: 90 },
    ],
  },
  {
    name: 'Chemistry',
    icon: 'FlaskConical',
    color: '#10B981',
    units: [
      { name: 'Unit 1: Organic Chemistry', durationMinutes: 60 },
      { name: 'Unit 2: Inorganic Chemistry', durationMinutes: 45 },
    ],
  },
  {
    name: 'Biology',
    icon: 'Dna',
    color: '#F59E0B',
    units: [
      { name: 'Unit 1: Cell Biology', durationMinutes: 60 },
      { name: 'Unit 2: Genetics', durationMinutes: 90 },
    ],
  },
  {
    name: 'History',
    icon: 'History',
    color: '#8B5CF6',
    units: [
      { name: 'Unit 1: Ancient Civilizations', durationMinutes: 45 },
      { name: 'Unit 2: Modern Era', durationMinutes: 60 },
    ],
  },
  {
    name: 'Geography',
    icon: 'Globe',
    color: '#06B6D4',
    units: [
      { name: 'Unit 1: Physical Geography', durationMinutes: 60 },
      { name: 'Unit 2: Human Geography', durationMinutes: 60 },
    ],
  },
  {
    name: 'Computer Science',
    icon: 'Laptop',
    color: '#374151',
    units: [
      { name: 'Unit 1: Programming Basics', durationMinutes: 60 },
      { name: 'Unit 2: Data Structures', durationMinutes: 90 },
      { name: 'Unit 3: Algorithms', durationMinutes: 120 },
    ],
  },
  {
    name: 'Literature',
    icon: 'BookOpen',
    color: '#EC4899',
    units: [
      { name: 'Unit 1: Classical Poetry', durationMinutes: 45 },
      { name: 'Unit 2: Modern Fiction', durationMinutes: 60 },
    ],
  },
  {
    name: 'Economics',
    icon: 'TrendingUp',
    color: '#14B8A6',
    units: [
      { name: 'Unit 1: Microeconomics', durationMinutes: 60 },
      { name: 'Unit 2: Macroeconomics', durationMinutes: 60 },
    ],
  },
  {
    name: 'Psychology',
    icon: 'Brain',
    color: '#F97316',
    units: [
      { name: 'Unit 1: Behavioral Science', durationMinutes: 60 },
      { name: 'Unit 2: Cognitive Theory', durationMinutes: 60 },
    ],
  },
];

const seedSubjects = async () => {
  try {
    const count = await Subject.countDocuments();
    if (count === 0) {
      await Subject.insertMany(subjectsData);
      console.log('✅ Subjects seeded successfully');
    } else {
      console.log('ℹ️ Subjects already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
  }
};

module.exports = seedSubjects;
