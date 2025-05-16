const validateRegistration = (data) => {
  const errors = {};

  // Username validation
  if (!data.username) {
    errors.username = 'Username is required';
  } else if (data.username.length < 3 || data.username.length > 30) {
    errors.username = 'Username must be between 3 and 30 characters';
  }

  // Email validation
  if (!data.email) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = 'Email is invalid';
    }
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateLogin = (data) => {
  const errors = {};

  // Email/username validation
  if (!data.email && !data.username) {
    errors.login = 'Email or username is required';
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateTradeRequest = (data) => {
  const errors = {};

  // Share validation
  if (!data.symbol) {
    errors.share = 'Symbol is required';
  }

  // Quantity validation
  if (!data.quantity) {
    errors.quantity = 'Quantity is required';
  } else if (isNaN(data.quantity) || data.quantity <= 0) {
    errors.quantity = 'Quantity must be a positive number';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validatePortfolioCreation = (data) => {
  const errors = {};

  // Name validation (optional field with default)
  if (data.name && (data.name.length < 3 || data.name.length > 50)) {
    errors.name = 'Portfolio name must be between 3 and 50 characters';
  }

  // Initial balance validation (optional field with default)
  if (data.initialBalance) {
    if (isNaN(data.initialBalance) || parseFloat(data.initialBalance) < 0) {
      errors.initialBalance = 'Initial balance must be a non-negative number';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

const validateSharePriceUpdate = (data) => {
  const errors = {};

  // Validate updates array exists
  if (!data.updates || !Array.isArray(data.updates) || data.updates.length === 0) {
    errors.updates = 'Share price updates must be provided as an array';
    return {
      errors,
      isValid: false
    };
  }

  // Validate each update
  const invalidUpdates = [];
  
  data.updates.forEach((update, index) => {
    if (!update.symbol) {
      invalidUpdates.push({ index, error: 'Symbol is required' });
    }
    
    if (!update.price) {
      invalidUpdates.push({ index, error: 'Price is required' });
    } else if (isNaN(update.price) || parseFloat(update.price) <= 0) {
      invalidUpdates.push({ index, error: 'Price must be a positive number' });
    }
  });
  
  if (invalidUpdates.length > 0) {
    errors.invalidUpdates = invalidUpdates;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateTradeRequest,
  validatePortfolioCreation,
  validateSharePriceUpdate
}; 