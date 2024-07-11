require("dotenv").config({ path: "./../../.env" });
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
// import user model
const EmpRoles = require("../models/emp_rolesModel");

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        // run query on the model and send the result in done()
        const user = await EmpRoles.query().where({
          emp_id: payload.emp_id,
          role_id: payload.role_id,
        });
        if (user) done(null, user);
        else done(null, false);
      } catch (error) {
        done(null, error);
      }
    }
  )
);
