import bcrypt from 'bcrypt';

// Add this to your User model
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
