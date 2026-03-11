# engines/pricing_engine/calculator.py
from typing import Dict, Optional
from database.models import Category, PricingConfig
from sqlalchemy.orm import Session

class PricingCalculator:
    def __init__(self, db: Session):
        self.db = db
        self._load_config()
    
    def _load_config(self):
        """Load pricing configuration from database"""
        config = self.db.query(PricingConfig).first()
        if not config:
            # Create default config
            config = PricingConfig()
            self.db.add(config)
            self.db.commit()
        
        self.material_rate = config.material_rate
        self.time_rate = config.time_rate
        self.labour_cost = config.labour_cost
        self.profit_margin = config.profit_margin
        self.minimum_price = config.minimum_price
    
    def calculate_price(self, 
                       volume_cm3: float,
                       weight_grams: float,
                       print_time_hours: float,
                       category: Category = Category.NORMAL,
                       material: str = "PLA") -> Dict:
        """Calculate comprehensive pricing"""
        
        # Base costs
        material_cost = weight_grams * self.material_rate
        time_cost = print_time_hours * self.time_rate
        base_cost = material_cost + time_cost + self.labour_cost + self.profit_margin
        
        # Category multipliers
        category_multiplier = self._get_category_multiplier(category)
        
        # Material multipliers
        material_multiplier = self._get_material_multiplier(material)
        
        # Apply multipliers
        total_cost = base_cost * category_multiplier * material_multiplier
        
        # Ensure minimum price
        final_price = max(self.minimum_price, total_cost)
        
        return {
            'material_cost': round(material_cost, 2),
            'time_cost': round(time_cost, 2),
            'labour_cost': self.labour_cost,
            'profit_margin': self.profit_margin,
            'category_multiplier': category_multiplier,
            'material_multiplier': material_multiplier,
            'base_cost': round(base_cost, 2),
            'total_price': round(final_price, 2),
            'breakdown': {
                'material': f"₹{material_cost:.2f} ({weight_grams}g × ₹{self.material_rate}/g)",
                'time': f"₹{time_cost:.2f} ({print_time_hours}h × ₹{self.time_rate}/h)",
                'labour': f"₹{self.labour_cost}",
                'profit': f"₹{self.profit_margin}",
                'category': f"{category.value} (+{(category_multiplier-1)*100:.0f}%)" if category_multiplier != 1 else "",
                'material_type': f"{material} (+{(material_multiplier-1)*100:.0f}%)" if material_multiplier != 1 else ""
            }
        }
    
    def _get_category_multiplier(self, category: Category) -> float:
        """Get pricing multiplier based on category"""
        multipliers = {
            Category.NORMAL: 1.0,
            Category.GIFT: 1.2,    # 20% premium for customization
            Category.DENTAL: 2.5   # 150% premium for medical grade
        }
        return multipliers.get(category, 1.0)
    
    def _get_material_multiplier(self, material: str) -> float:
        """Get pricing multiplier based on material"""
        multipliers = {
            'PLA': 1.0,
            'ABS': 1.15,
            'PETG': 1.2,
            'TPU': 1.3,
            'RESIN': 2.0,  # For dental/high-detail
            'METAL': 5.0   # Future: metal printing
        }
        return multipliers.get(material.upper(), 1.0)
    
    def estimate_shipping(self, weight_grams: float, pincode: str) -> Dict:
        """Calculate shipping cost based on weight and location"""
        # Weight-based base rate
        base_rate = 40 if weight_grams <= 500 else 60
        
        # Zone-based pricing (from Rajkot 360005)
        local_zones = ['360', '361', '362', '363', '364', '365']
        state_zones = ['380', '390', '370', '383', '384', '385']
        
        if any(pincode.startswith(zone) for zone in local_zones):
            rate = 29
            eta = "2-4 days"
        elif any(pincode.startswith(zone) for zone in state_zones):
            rate = 49
            eta = "4-6 days"
        elif len(pincode) == 6 and pincode.isdigit():
            rate = 69
            eta = "5-8 days"
        else:
            rate = 99
            eta = "7-10 days"
        
        return {
            'cost': rate,
            'eta': eta,
            'courier': 'Standard Delivery'
        }