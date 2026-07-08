/**
 * Northgate Council - Parking Permit Portal
 * Interaction Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentStep: 1,
    maxStepCompleted: 1,
    theme: 'light',
    postcodeDb: {
      'GR1 3AA': [
        '12 Baker Street, Northgate, GR1 3AA',
        '14 Baker Street, Northgate, GR1 3AA',
        '16 Baker Street, Northgate, GR1 3AA',
        '18 Baker Street, Northgate, GR1 3AA'
      ],
      'GR1 3AB': [
        'Flat 1, Royal Crescent, Northgate, GR1 3AB',
        'Flat 2, Royal Crescent, Northgate, GR1 3AB',
        'Flat 3, Royal Crescent, Northgate, GR1 3AB'
      ],
      'W1B 2EL': [
        '10 Downing Chambers, London, W1B 2EL',
        '12 Downing Chambers, London, W1B 2EL'
      ]
    },
    vehicleDb: {
      'EL20GYH': { make: 'Tesla Model Y (Electric)', fuel: 'Electric (EV)', co2: '0 g/km', monthly: 0.00, annual: 0.00 },
      'EV19TST': { make: 'Jaguar I-PACE (Electric)', fuel: 'Electric (EV)', co2: '0 g/km', monthly: 0.00, annual: 0.00 },
      'LN68VXX': { make: 'Volkswagen Golf MHEV', fuel: 'Petrol Hybrid', co2: '115 g/km', monthly: 12.50, annual: 125.00 },
      'GF17SDF': { make: 'Ford Fiesta EcoBoost', fuel: 'Petrol', co2: '109 g/km', monthly: 12.50, annual: 125.00 },
      'DE11BAD': { make: 'Land Rover Defender V8', fuel: 'Petrol', co2: '281 g/km', monthly: 35.00, annual: 350.00 },
      'AB55XYZ': { make: 'BMW 530d xDrive', fuel: 'Diesel', co2: '164 g/km', monthly: 25.00, annual: 250.00 }
    },
    // Default pricing when vehicle plate is not in DB or before plate find
    pricing: {
      monthly: 15.00,
      annual: 150.00
    },
    selectedVehicle: null,
    uploads: {
      address: null,
      ownership: null,
      extra: null
    }
  };

  // DOM Elements - Stepper
  const stepNodes = document.querySelectorAll('.step-node');
  const stepFill = document.getElementById('step-progress-fill');
  const formsStepContent = document.querySelectorAll('.form-step-content');
  const breadcrumbStep = document.getElementById('current-breadcrumb-step');

  // DOM Elements - Navigation Actions
  const btnPrev = document.getElementById('prev-btn');
  const btnNext = document.getElementById('next-btn');
  const btnSave = document.getElementById('save-draft-btn');
  const btnPaySubmit = document.getElementById('pay-submit-btn');

  // DOM Elements - Postcode Lookup
  const postcodeField = document.getElementById('postcode');
  const postcodeLookupBtn = document.getElementById('postcode-lookup');
  const selectAddressContainer = document.getElementById('address-select-container');
  const addressSelect = document.getElementById('addressSelect');
  const manualAddressGroup = document.getElementById('manual-address-group');
  const fullAddressField = document.getElementById('fullAddress');

  // DOM Elements - Vehicle Lookup
  const vehicleRegField = document.getElementById('vehicleReg');
  const regLookupBtn = document.getElementById('reg-lookup');
  const vehicleDetailsCard = document.getElementById('vehicle-details-card');
  const specMake = document.getElementById('v-make');
  const specFuel = document.getElementById('v-fuel');
  const specEmissions = document.getElementById('v-emissions');
  const monthlyRateEl = document.getElementById('monthly-rate');
  const annualRateEl = document.getElementById('annual-rate');

  // Plan Cards
  const planMonthlyCard = document.getElementById('plan-monthly-card');
  const planAnnualCard = document.getElementById('plan-annual-card');

  // Upload Containers
  const uploadInputAddress = document.getElementById('file-address');
  const uploadInputOwnership = document.getElementById('file-ownership');
  const uploadInputExtra = document.getElementById('file-extra');

  // Modal Payments
  const paymentModalOverlay = document.getElementById('payment-modal-overlay');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const paymentForm = document.getElementById('paymentForm');
  const paymentEntryScreen = document.getElementById('payment-entry-screen');
  const paymentProcessingScreen = document.getElementById('payment-processing-screen');
  const paymentSuccessScreen = document.getElementById('payment-success-screen');
  const successFinishedBtn = document.getElementById('success-finished-btn');

  // Resume application banner elements
  const resumeBanner = document.getElementById('resume-banner');
  const resumeYesBtn = document.getElementById('resume-yes');
  const resumeNoBtn = document.getElementById('resume-no');
  const quickLoadBtn = document.getElementById('quick-load-btn');

  // Theme toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  const sunIcon = themeToggleBtn.querySelector('.icon-sun');
  const moonIcon = themeToggleBtn.querySelector('.icon-moon');

  // Initialize
  initApp();

  function initApp() {
    setupTheme();
    setupNavigation();
    setupLookupSimulations();
    setupPlanSelection();
    setupUploadDragDrop();
    setupPaymentFlow();
    checkDraftSavedState();
  }

  // --- Theme Toggle ---
  function setupTheme() {
    // Check localStorage theme preference
    const savedTheme = localStorage.getItem('permitTheme');
    if (savedTheme === 'dark') {
      enableDarkTheme();
    } else {
      enableLightTheme();
    }

    themeToggleBtn.addEventListener('click', () => {
      if (document.body.classList.contains('light-theme')) {
        enableDarkTheme();
      } else {
        enableLightTheme();
      }
    });
  }

  function enableDarkTheme() {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
    localStorage.setItem('permitTheme', 'dark');
    state.theme = 'dark';
  }

  function enableLightTheme() {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
    localStorage.setItem('permitTheme', 'light');
    state.theme = 'light';
  }

  // --- Step Navigation & Stepper UI ---
  function setupNavigation() {
    btnNext.addEventListener('click', () => {
      if (validateCurrentStep()) {
        goToStep(state.currentStep + 1);
      } else {
        createToast('Validation Error', 'Please complete all required fields correctly before moving on.', 'error');
      }
    });

    btnPrev.addEventListener('click', () => {
      goToStep(state.currentStep - 1);
    });

    btnSave.addEventListener('click', () => {
      saveDraftApplication();
    });

    // Make step nodes clickable for completed steps
    stepNodes.forEach(node => {
      node.addEventListener('click', (e) => {
        const stepNum = parseInt(node.getAttribute('data-step'));
        if (stepNum <= state.maxStepCompleted || stepNum < state.currentStep) {
          goToStep(stepNum);
        } else {
          // Check if previous steps validate
          let canGo = true;
          for (let i = 1; i < stepNum; i++) {
            if (i === state.currentStep) {
              if (!validateCurrentStep()) {
                canGo = false;
                break;
              }
            } else {
              // Standard field validate
              if (!validateStep(i)) {
                canGo = false;
                break;
              }
            }
          }
          if (canGo) {
            goToStep(stepNum);
          } else {
            createToast('Cannot Skip', 'Please fully validate the current form setup first.', 'warning');
          }
        }
      });
    });
  }

  function goToStep(stepNum) {
    if (stepNum < 1 || stepNum > 4) return;
    
    // Hide active step content
    document.getElementById(`form-step-${state.currentStep}`).classList.remove('active');
    
    // Set state
    state.currentStep = stepNum;
    if (stepNum > state.maxStepCompleted) {
      state.maxStepCompleted = stepNum;
    }

    // Show new step content
    const newStepContent = document.getElementById(`form-step-${state.currentStep}`);
    newStepContent.classList.add('active');
    
    // Update Stepper Visuals
    updateStepperVisuals();
    updateNavigationButtons();
    
    // If Step 4, compile review screen
    if (stepNum === 4) {
      compileReviewScreen();
    }

    // Scroll to top of card nicely
    document.querySelector('.permit-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateStepperVisuals() {
    stepNodes.forEach(node => {
      const nodeStepNum = parseInt(node.getAttribute('data-step'));
      node.classList.remove('active', 'completed');
      
      if (nodeStepNum === state.currentStep) {
        node.classList.add('active');
      } else if (nodeStepNum < state.currentStep) {
        node.classList.add('completed');
      }
    });

    // Calculate indicator line size
    // 4 nodes: 0% to node 1, 33.3% to node 2, 66.6% to node 3, 100% to node 4
    const percentage = ((state.currentStep - 1) / 3) * 100;
    stepFill.style.width = `${percentage}%`;

    // Breadcrumb updates
    let label = 'Step 1: Personal Info';
    if (state.currentStep === 2) label = 'Step 2: Permit Details';
    else if (state.currentStep === 3) label = 'Step 3: Document uploads';
    else if (state.currentStep === 4) label = 'Step 4: Overview';
    breadcrumbStep.textContent = label;
  }

  function updateNavigationButtons() {
    // Previous button visibility
    if (state.currentStep === 1) {
      btnPrev.classList.add('hide');
    } else {
      btnPrev.classList.remove('hide');
    }

    // Next / Pay buttons visibility
    if (state.currentStep === 4) {
      btnNext.classList.add('hide');
      btnPaySubmit.classList.remove('hide');
    } else {
      btnNext.classList.remove('hide');
      btnPaySubmit.classList.add('hide');
    }
  }

  // --- Validations logic ---
  function validateCurrentStep() {
    return validateStep(state.currentStep);
  }

  function validateStep(stepNum) {
    let isValid = true;
    
    if (stepNum === 1) {
      // Validate Step 1 details
      const firstName = document.getElementById('firstName');
      const surname = document.getElementById('surname');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      
      const dobDay = document.getElementById('dobDay');
      const dobMonth = document.getElementById('dobMonth');
      const dobYear = document.getElementById('dobYear');
      
      const postcode = document.getElementById('postcode');
      const fullAddress = document.getElementById('fullAddress');
      
      const termsCheck = document.getElementById('termsCheck');
      const privacyCheck = document.getElementById('privacyCheck');

      // Names
      if (!firstName.value.trim()) { setFieldError(firstName, true); isValid = false; }
      else { setFieldError(firstName, false); }

      if (!surname.value.trim()) { setFieldError(surname, true); isValid = false; }
      else { setFieldError(surname, false); }

      // Date of birth
      const day = parseInt(dobDay.value);
      const month = parseInt(dobMonth.value);
      const year = parseInt(dobYear.value);
      const dobGroup = document.querySelector('.dob-group');
      if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2026) {
        dobGroup.classList.add('has-error');
        isValid = false;
      } else {
        // Check age is at least 17
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 17) {
          dobGroup.classList.add('has-error');
          isValid = false;
        } else {
          dobGroup.classList.remove('has-error');
        }
      }

      // Postcode & Address check
      if (!postcode.value.trim()) { setFieldError(postcode, true); isValid = false; }
      else { setFieldError(postcode, false); }

      if (!fullAddress.value.trim()) {
        postcode.closest('.form-group').classList.add('has-error');
        isValid = false;
      }

      // Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value)) { setFieldError(email, true); isValid = false; }
      else { setFieldError(email, false); }

      // Phone
      if (!phone.value.trim() || phone.value.replace(/\s/g, '').length < 10) { setFieldError(phone, true); isValid = false; }
      else { setFieldError(phone, false); }

      // Preferences checkbox options: must have at least one checkbox active
      const prefsChecked = document.querySelectorAll('input[name="contactPref"]:checked');
      const prefsGroup = document.getElementById('error-contactPref').closest('.form-group');
      if (prefsChecked.length === 0) {
        prefsGroup.classList.add('has-error');
        isValid = false;
      } else {
        prefsGroup.classList.remove('has-error');
      }

      // Terms / policy
      if (!termsCheck.checked) { setFieldError(termsCheck, true); isValid = false; }
      else { setFieldError(termsCheck, false); }

      if (!privacyCheck.checked) { setFieldError(privacyCheck, true); isValid = false; }
      else { setFieldError(privacyCheck, false); }
    }
    
    else if (stepNum === 2) {
      // Validate Step 2 details
      const vehicleReg = document.getElementById('vehicleReg');
      const drivingLicense = document.getElementById('drivingLicense');
      const permitPostcode = document.getElementById('permitPostcode');

      if (!vehicleReg.value.trim()) { setFieldError(vehicleReg, true); isValid = false; }
      else { setFieldError(vehicleReg, false); }

      // Driving License standard format checks (approx 16 length)
      if (!drivingLicense.value.trim() || drivingLicense.value.replace(/\s/g, '').length < 16) { 
        setFieldError(drivingLicense, true); 
        isValid = false; 
      } else { 
        setFieldError(drivingLicense, false); 
      }

      if (!permitPostcode.value.trim()) { setFieldError(permitPostcode, true); isValid = false; }
      else { setFieldError(permitPostcode, false); }
    }
    
    else if (stepNum === 3) {
      // Validate Step 3 details (required uploads)
      const addressBox = document.getElementById('upload-box-address');
      const ownershipBox = document.getElementById('upload-box-ownership');

      if (!state.uploads.address) {
        addressBox.classList.add('has-error');
        isValid = false;
      } else {
        addressBox.classList.remove('has-error');
      }

      if (!state.uploads.ownership) {
        ownershipBox.classList.add('has-error');
        isValid = false;
      } else {
        ownershipBox.classList.remove('has-error');
      }
    }

    return isValid;
  }

  function setFieldError(field, isError) {
    const group = field.closest('.form-group') || field.closest('.checkbox-container');
    if (isError) {
      group.classList.add('has-error');
    } else {
      group.classList.remove('has-error');
    }
  }

  // --- API lookup simulation (Postcode & Registration plate) ---
  function setupLookupSimulations() {
    // Postcode Lookup
    postcodeLookupBtn.addEventListener('click', () => {
      const pc = postcodeField.value.trim().toUpperCase();
      if (!pc) {
        postcodeField.closest('.form-group').classList.add('has-error');
        createToast('Entry Missing', 'Please enter a postcode first.', 'warning');
        return;
      }

      postcodeLookupBtn.innerHTML = '<span class="spinner-sm"></span> Searching';
      postcodeLookupBtn.disabled = true;

      // Simulate network wait
      setTimeout(() => {
        postcodeLookupBtn.innerHTML = 'Find Address';
        postcodeLookupBtn.disabled = false;

        const results = state.postcodeDb[pc];
        addressSelect.innerHTML = '<option value="">-- Choose address from list --</option>';

        if (results) {
          results.forEach(addr => {
            const opt = document.createElement('option');
            opt.value = addr;
            opt.textContent = addr;
            addressSelect.appendChild(opt);
          });
          
          // Show Select dropdown
          selectAddressContainer.classList.remove('hide');
          postcodeField.closest('.form-group').classList.remove('has-error');
          createToast('Addresses Found', `Retrieved ${results.length} addresses for ${pc}.`, 'success');
        } else {
          // Default fallbacks for unrecognized postcode to simulate
          const fallbackAddress = `101 Green Lane, Northgate, ${pc}`;
          const opt = document.createElement('option');
          opt.value = fallbackAddress;
          opt.textContent = fallbackAddress;
          addressSelect.appendChild(opt);
          
          selectAddressContainer.classList.remove('hide');
          postcodeField.closest('.form-group').classList.remove('has-error');
          createToast('Simulated Address', 'Address database simulated successfully.', 'success');
        }
      }, 1000);
    });

    addressSelect.addEventListener('change', () => {
      const selectedAddr = addressSelect.value;
      if (selectedAddr) {
        manualAddressGroup.classList.remove('hide');
        fullAddressField.value = selectedAddr;
      } else {
        manualAddressGroup.classList.add('hide');
        fullAddressField.value = '';
      }
    });

    // Plate Registration Lookup
    regLookupBtn.addEventListener('click', () => {
      const plate = vehicleRegField.value.trim().toUpperCase().replace(/\s/g, '');
      if (!plate) {
        vehicleRegField.closest('.form-group').classList.add('has-error');
        createToast('Entry Missing', 'Please input a vehicle registration plate number.', 'warning');
        return;
      }

      regLookupBtn.innerHTML = '<span class="spinner-sm"></span> DMV Lookup';
      regLookupBtn.disabled = true;

      setTimeout(() => {
        regLookupBtn.innerHTML = 'Find Vehicle';
        regLookupBtn.disabled = false;

        // Visual plate Replica display
        const replica = vehicleDetailsCard.querySelector('.plate-replica');
        // Format plate standard UK (like AB12 CDE)
        replica.textContent = formatUkPlate(plate);

        // Find details in mock DB or apply defaults
        let info = state.vehicleDb[plate];
        if (!info) {
          // Generate automated specs based on length/letters for demo robustness
          if (plate.startsWith('E')) {
            info = { make: 'Tesla Model 3 Standard', fuel: 'Electric (EV)', co2: '0 g/km', monthly: 0.00, annual: 0.00 };
          } else if (plate.length % 2 === 0) {
            info = { make: 'Vauxhall Corsa Turbo', fuel: 'Petrol', co2: '124 g/km', monthly: 15.00, annual: 150.00 };
          } else {
            info = { make: 'Audi A4 TDI', fuel: 'Diesel', co2: '139 g/km', monthly: 25.00, annual: 250.00 };
          }
        }

        // Apply specifications to element
        specMake.textContent = info.make;
        specFuel.textContent = info.fuel;
        specEmissions.textContent = info.co2;

        // Apply Pricing dynamically based on specs!
        state.pricing.monthly = info.monthly;
        state.pricing.annual = info.annual;
        
        monthlyRateEl.innerHTML = `&pound;${info.monthly.toFixed(2)}`;
        annualRateEl.innerHTML = `&pound;${info.annual.toFixed(2)}`;

        state.selectedVehicle = info;
        state.selectedVehicle.plate = formatUkPlate(plate);
        
        vehicleDetailsCard.classList.remove('hide');
        vehicleRegField.closest('.form-group').classList.remove('has-error');
        createToast('Vehicle Registered', `${info.make} successfully retrieved. Tariff updated.`, 'success');
      }, 1200);
    });
  }

  function formatUkPlate(plate) {
    if (plate.length > 4) {
      return plate.slice(0, 4) + ' ' + plate.slice(4);
    }
    return plate;
  }

  // --- Plan selection cards toggling ---
  function setupPlanSelection() {
    planMonthlyCard.addEventListener('click', () => {
      document.getElementById('plan-monthly').checked = true;
      planMonthlyCard.classList.add('active');
      planAnnualCard.classList.remove('active');
    });

    planAnnualCard.addEventListener('click', () => {
      document.getElementById('plan-annual').checked = true;
      planAnnualCard.classList.add('active');
      planMonthlyCard.classList.remove('active');
    });
  }

  // --- Upload Files drag drop simulations ---
  function setupUploadDragDrop() {
    const setupBox = (boxId, inputId, dropzoneId, stateKey) => {
      const box = document.getElementById(boxId);
      const input = document.getElementById(inputId);
      const dropzone = document.getElementById(dropzoneId);
      const prompt = dropzone.querySelector('.dropzone-prompt');
      const uploadingBox = dropzone.querySelector('.dropzone-uploading');
      const completeBox = dropzone.querySelector('.dropzone-complete');
      const labelStatus = box.querySelector('.upload-status-indicator');

      // Drag enter/over events
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        }, false);
      });

      // Drop file event
      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
          handleSelectedFile(files[0]);
        }
      });

      // Standard select file event
      input.addEventListener('change', () => {
        if (input.files.length) {
          handleSelectedFile(input.files[0]);
        }
      });

      function handleSelectedFile(file) {
        // Toggle view loading simulator
        prompt.classList.add('hide');
        uploadingBox.classList.remove('hide');
        box.classList.remove('has-error');

        // Progress timeout
        setTimeout(() => {
          uploadingBox.classList.add('hide');
          completeBox.classList.remove('hide');

          // Render file description details
          const nameEl = completeBox.querySelector('.file-name-text');
          const sizeEl = completeBox.querySelector('.file-size-text');
          nameEl.textContent = file.name;
          sizeEl.textContent = `(${(file.size / (1024 * 1024)).toFixed(1)} MB)`;

          // Modify Status Badge
          labelStatus.textContent = 'Uploaded';
          labelStatus.className = 'upload-status-indicator text-success';
          box.classList.add('upload-success');

          // Save to local variable state
          state.uploads[stateKey] = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          };

          createToast('File Uploaded', `${file.name} uploaded successfully.`, 'success');
        }, 1500);
      }

      // Delete action listener
      const deleteBtn = completeBox.querySelector('.delete-file-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        completeBox.classList.add('hide');
        prompt.classList.remove('hide');
        input.value = ''; // Clear DOM file

        // Reset badge
        const isOpt = stateKey === 'extra';
        labelStatus.textContent = isOpt ? 'Optional' : 'Missing';
        labelStatus.className = isOpt ? 'upload-status-indicator text-muted' : 'upload-status-indicator text-amber';
        box.classList.remove('upload-success');

        state.uploads[stateKey] = null;
        createToast('File Removed', 'Supporting file successfully removed.', 'warning');
      });
    };

    setupBox('upload-box-address', 'file-address', 'dropzone-address', 'address');
    setupBox('upload-box-ownership', 'file-ownership', 'dropzone-ownership', 'ownership');
    setupBox('upload-box-extra', 'file-extra', 'dropzone-extra', 'extra');
  }

  // --- Step 4 overview compiler ---
  function compileReviewScreen() {
    // 1. Personal
    const firstName = document.getElementById('firstName').value;
    const surname = document.getElementById('surname').value;
    const dob = `${document.getElementById('dobDay').value}/${document.getElementById('dobMonth').value}/${document.getElementById('dobYear').value}`;
    const address = document.getElementById('fullAddress').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    const prefs = Array.from(document.querySelectorAll('input[name="contactPref"]:checked'))
      .map(c => c.value)
      .join(', ');

    document.getElementById('rev-name').textContent = `${firstName} ${surname}`;
    document.getElementById('rev-dob').textContent = dob;
    document.getElementById('rev-address').textContent = address;
    document.getElementById('rev-email').textContent = email;
    document.getElementById('rev-phone').textContent = phone;
    document.getElementById('rev-prefs').textContent = prefs;

    // 2. Permit details
    const plate = vehicleRegField.value.toUpperCase();
    const license = document.getElementById('drivingLicense').value.toUpperCase();
    const permitPost = document.getElementById('permitPostcode').value.toUpperCase();

    document.getElementById('rev-plate').textContent = formatUkPlate(plate);
    document.getElementById('rev-license').textContent = license;
    document.getElementById('rev-permit-postcode').textContent = permitPost;

    if (state.selectedVehicle) {
      document.getElementById('rev-car-specs').textContent = `${state.selectedVehicle.make} (${state.selectedVehicle.fuel}, ${state.selectedVehicle.co2})`;
    } else {
      document.getElementById('rev-car-specs').textContent = 'Generic Petrol Sedan Class';
    }

    // 3. Address documents
    document.getElementById('rev-doc-address').textContent = state.uploads.address ? `${state.uploads.address.name} ${state.uploads.address.size}` : 'None';
    document.getElementById('rev-doc-ownership').textContent = state.uploads.ownership ? `${state.uploads.ownership.name} ${state.uploads.ownership.size}` : 'None';
    document.getElementById('rev-doc-extra').textContent = state.uploads.extra ? `${state.uploads.extra.name} ${state.uploads.extra.size}` : 'None (Optional)';

    // Edit step nodes actions
    document.querySelectorAll('.edit-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.getAttribute('data-target-step'));
        goToStep(target);
      });
    });

    // Subscriptions Pricing calculation display
    const selectedPlan = document.querySelector('input[name="paymentPlan"]:checked').value;
    const isMonthly = selectedPlan === 'Monthly';
    
    const rateText = isMonthly ? `&pound;${state.pricing.monthly.toFixed(2)}` : `&pound;${state.pricing.annual.toFixed(2)}`;
    const descText = isMonthly ? 'Resident Permit (Monthly Plan)' : 'Resident Permit (Annual Billing Scheme)';
    const periodText = isMonthly ? 'every month' : 'every year';

    document.getElementById('bill-plan-desc').textContent = descText;
    document.getElementById('bill-rate-text').innerHTML = rateText;
    document.getElementById('bill-period-text').textContent = periodText;

    // Save configuration settings
    document.getElementById('modal-bill-figure').innerHTML = rateText;
    document.getElementById('modal-bill-period').textContent = isMonthly ? '/ month' : '/ year';
  }

  // --- Payment Modal Flow interactions ---
  function setupPaymentFlow() {
    btnPaySubmit.addEventListener('click', () => {
      // Trigger payment popup modal view
      paymentModalOverlay.classList.remove('hide');
      paymentEntryScreen.classList.remove('hide');
      paymentProcessingScreen.classList.add('hide');
      paymentSuccessScreen.classList.add('hide');
      
      // Auto populate owner name in card container
      const fn = document.getElementById('firstName').value;
      const sn = document.getElementById('surname').value;
      document.getElementById('cardName').value = `${fn.charAt(0)}. ${sn}`;
    });

    closeModalBtn.addEventListener('click', () => {
      paymentModalOverlay.classList.add('hide');
    });

    // Expiry input helper (inserts '/' automatically)
    const cardExpiryInput = document.getElementById('cardExpiry');
    cardExpiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 2) {
        val = val.slice(0,2) + '/' + val.slice(2,4);
      }
      e.target.value = val;
    });

    // Card number format inputs helper
    const cardNumInput = document.getElementById('cardNumber');
    cardNumInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      let formattedVal = '';
      for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formattedVal += ' ';
        formattedVal += val[i];
      }
      e.target.value = formattedVal;
    });

    // Submit pay simulation
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simple credentials check
      const cardName = document.getElementById('cardName').value;
      const cardNumber = document.getElementById('cardNumber').value;
      const cardExpiry = document.getElementById('cardExpiry').value;
      const cardCvv = document.getElementById('cardCvv').value;

      if (!cardName || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3) {
        createToast('Card Details Incorrect', 'Please review credit card input credentials.', 'error');
        return;
      }

      // Transition to processing
      paymentEntryScreen.classList.add('hide');
      paymentProcessingScreen.classList.remove('hide');

      setTimeout(() => {
        paymentProcessingScreen.classList.add('hide');
        paymentSuccessScreen.classList.remove('hide');

        // Compile receipt credentials details
        const randRef = 'GR-' + Math.floor(10000000 + Math.random() * 90000000);
        document.getElementById('rcpt-ref').textContent = randRef;

        const plate = vehicleRegField.value.toUpperCase();
        document.getElementById('rcpt-plate').textContent = formatUkPlate(plate);

        const plan = document.querySelector('input[name="paymentPlan"]:checked').value;
        document.getElementById('rcpt-charge-type').textContent = plan === 'Monthly' ? 'Monthly Sub' : 'Annual Sub';
        
        const price = plan === 'Monthly' ? state.pricing.monthly : state.pricing.annual;
        document.getElementById('rcpt-charge-sum').innerHTML = `&pound;${price.toFixed(2)}`;

        // Clear local storage draft config
        localStorage.removeItem('permitApplicationDraft');
        checkDraftSavedState();

        createToast('Permit Issued', 'Payment validated. Permit is now active.', 'success');
      }, 2500);
    });

    successFinishedBtn.addEventListener('click', () => {
      // Refresh form reset pages completely
      paymentModalOverlay.classList.add('hide');
      location.reload();
    });
  }

  // --- Saved applications local Draft recovery functions ---
  function saveDraftApplication() {
    const draft = {
      firstName: document.getElementById('firstName').value,
      surname: document.getElementById('surname').value,
      dobDay: document.getElementById('dobDay').value,
      dobMonth: document.getElementById('dobMonth').value,
      dobYear: document.getElementById('dobYear').value,
      postcode: postcodeField.value,
      fullAddress: fullAddressField.value,
      addressOptions: Array.from(addressSelect.options).map(o => o.value).filter(Boolean),
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      contactPrefs: Array.from(document.querySelectorAll('input[name="contactPref"]:checked')).map(c => c.value),
      vehicleReg: vehicleRegField.value,
      drivingLicense: document.getElementById('drivingLicense').value,
      permitPostcode: document.getElementById('permitPostcode').value,
      selectedPlan: document.querySelector('input[name="paymentPlan"]:checked').value,
      pricing: state.pricing,
      selectedVehicle: state.selectedVehicle,
      maxStepCompleted: state.maxStepCompleted
    };

    localStorage.setItem('permitApplicationDraft', JSON.stringify(draft));
    createToast('Progress Saved', 'Draft application saved successfully to local storage.', 'success');
    checkDraftSavedState();
  }

  function checkDraftSavedState() {
    const draft = localStorage.getItem('permitApplicationDraft');
    if (draft) {
      resumeBanner.classList.remove('hide');
      quickLoadBtn.classList.remove('hide');
    } else {
      resumeBanner.classList.add('hide');
      quickLoadBtn.classList.add('hide');
    }
  }

  resumeYesBtn.addEventListener('click', () => {
    loadDraftApplication();
    resumeBanner.classList.add('hide');
  });

  resumeNoBtn.addEventListener('click', () => {
    resumeBanner.classList.add('hide');
    localStorage.removeItem('permitApplicationDraft');
    checkDraftSavedState();
  });

  quickLoadBtn.addEventListener('click', () => {
    loadDraftApplication();
  });

  function loadDraftApplication() {
    const draftStr = localStorage.getItem('permitApplicationDraft');
    if (!draftStr) return;

    try {
      const draft = JSON.parse(draftStr);
      
      // Load values into inputs
      document.getElementById('firstName').value = draft.firstName || '';
      document.getElementById('surname').value = draft.surname || '';
      document.getElementById('dobDay').value = draft.dobDay || '';
      document.getElementById('dobMonth').value = draft.dobMonth || '';
      document.getElementById('dobYear').value = draft.dobYear || '';
      
      postcodeField.value = draft.postcode || '';
      fullAddressField.value = draft.fullAddress || '';

      // Re-populate select addresses
      addressSelect.innerHTML = '<option value="">-- Choose address from list --</option>';
      if (draft.addressOptions && draft.addressOptions.length) {
        draft.addressOptions.forEach(addr => {
          const opt = document.createElement('option');
          opt.value = addr;
          opt.textContent = addr;
          addressSelect.appendChild(opt);
        });
        selectAddressContainer.classList.remove('hide');
        manualAddressGroup.classList.remove('hide');
      }

      document.getElementById('email').value = draft.email || '';
      document.getElementById('phone').value = draft.phone || '';

      // Checkboxes preferences
      document.querySelectorAll('input[name="contactPref"]').forEach(box => {
        box.checked = draft.contactPrefs.includes(box.value);
      });

      // Permit section details
      vehicleRegField.value = draft.vehicleReg || '';
      document.getElementById('drivingLicense').value = draft.drivingLicense || '';
      document.getElementById('permitPostcode').value = draft.permitPostcode || '';

      // Pricing & Plan Load
      if (draft.pricing) {
        state.pricing = draft.pricing;
        monthlyRateEl.innerHTML = `&pound;${state.pricing.monthly.toFixed(2)}`;
        annualRateEl.innerHTML = `&pound;${state.pricing.annual.toFixed(2)}`;
      }

      if (draft.selectedPlan === 'Annually') {
        document.getElementById('plan-annual').checked = true;
        planAnnualCard.classList.add('active');
        planMonthlyCard.classList.remove('active');
      } else {
        document.getElementById('plan-monthly').checked = true;
        planMonthlyCard.classList.add('active');
        planAnnualCard.classList.remove('active');
      }

      // Re-populate plate details
      if (draft.selectedVehicle) {
        state.selectedVehicle = draft.selectedVehicle;
        vehicleDetailsCard.querySelector('.plate-replica').textContent = draft.selectedVehicle.plate;
        specMake.textContent = draft.selectedVehicle.make;
        specFuel.textContent = draft.selectedVehicle.fuel;
        specEmissions.textContent = draft.selectedVehicle.co2;
        vehicleDetailsCard.classList.remove('hide');
      } else {
        vehicleDetailsCard.classList.add('hide');
      }

      state.maxStepCompleted = draft.maxStepCompleted || 1;
      
      // Go to latest completed step
      goToStep(state.maxStepCompleted);
      createToast('Draft Restored', 'Your previous application form draft was restored.', 'success');
    } catch (e) {
      console.error('Failed to parse draft details', e);
      createToast('Restore Error', 'Corrupted draft data inside local storage.', 'error');
    }
  }

  // --- Dynamic Toast Creator ---
  function createToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Select Icon based on type
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="text-success" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="text-danger" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg class="text-warning" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-body">
        <h4 class="toast-title">${title}</h4>
        <p class="toast-msg">${message}</p>
      </div>
      <button class="toast-close-btn">&times;</button>
    `;

    container.appendChild(toast);

    // Auto removal
    const removeTimeout = setTimeout(() => {
      closeToast(toast);
    }, 4000);

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
      clearTimeout(removeTimeout);
      closeToast(toast);
    });
  }

  function closeToast(toast) {
    toast.style.transform = 'translateX(100px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
});


