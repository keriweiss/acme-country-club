const { Sequelize, DataTypes } = require("sequelize");
const db = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme-countryclub"
);

const express = require("express");
const app = express();

const Facilities = db.define("facility", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  fac_name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
});

const Members = db.define("member", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  first_name: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
});

const Bookings = db.define("booking", {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
});

Bookings.belongsTo(Members);
Members.hasMany(Bookings);

Bookings.belongsTo(Facilities);
Facilities.hasMany(Bookings);

Members.belongsTo(Members, { as: "sponsor" });
Members.hasMany(Members, { foreignKey: "sponsorId" });

const syncAndSeed = async () => {
  console.log("test");
  await db.sync({ force: true });
  const [Suzie, Jo, Jane] = await Promise.all(
    ["Suzie", "Jo", "Jane"].map((member) =>
      Members.create({ first_name: member })
    )
  );
  const [tennis, golf, pool] = await Promise.all(
    ["tennis", "golf", "pool"].map((facility) =>
      Facilities.create({ fac_name: facility })
    )
  );
  const tuesday = await Bookings.create({
    id: 1,
    startTime: new Date("1 / 15 / 21"),
    endTime: new Date("2 / 10 / 21"),
  });
  const wednesday = await Bookings.create({
    id: 2,
    startTime: new Date("1 / 10 / 21"),
    endTime: new Date("1 / 10 / 21"),
  });
  wednesday.memberId = Suzie.id;
  wednesday.facilityId = tennis.id;
  tuesday.memberId = Jo.id;
  tuesday.facilityId = golf.id;
  Suzie.sponsorId = Jo.id;
  Jane.sponsorId = Jo.id;

  await wednesday.save();
  await tuesday.save();
  await Suzie.save();
  await Jane.save();
};

const run = async () => {
  try {
    await syncAndSeed();
  } catch (err) {
    console.log(err);
  }
};

run();
