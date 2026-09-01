import os
import json
from typing import Any, Dict, Optional

try:
    from pydantic import BaseModel as _PydanticBaseModel, Field as _PydanticField
    try:
        from pydantic_settings import BaseSettings as _PydanticBaseSettings
    except ImportError:
        _PydanticBaseSettings = _PydanticBaseModel
    
    BaseModel = _PydanticBaseModel
    BaseSettings = _PydanticBaseSettings
    Field = _PydanticField
    EmailStr = str
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            # Apply defaults from class annotations / attributes
            for k, v in self.__class__.__dict__.items():
                if not k.startswith("_") and not callable(v):
                    setattr(self, k, v)
            for k, v in kwargs.items():
                setattr(self, k, v)

        def dict(self) -> Dict[str, Any]:
            res = {}
            for k, v in self.__dict__.items():
                if not k.startswith("_") and not callable(v):
                    if hasattr(v, "dict") and callable(v.dict):
                        res[k] = v.dict()
                    elif isinstance(v, list):
                        res[k] = [item.dict() if hasattr(item, "dict") else item for item in v]
                    else:
                        res[k] = v
            return res

        def model_dump(self) -> Dict[str, Any]:
            return self.dict()

        def json(self) -> str:
            return json.dumps(self.dict())

        def model_dump_json(self) -> str:
            return self.json()

        @classmethod
        def parse_obj(cls, obj: Dict[str, Any]):
            return cls(**obj)

        def __repr__(self) -> str:
            return f"{self.__class__.__name__}({self.dict()})"

    class BaseSettings(BaseModel):
        def __init__(self, **kwargs):
            super().__init__()
            for k in list(self.__dict__.keys()):
                env_val = os.environ.get(k)
                if env_val is not None:
                    curr_val = getattr(self, k)
                    if isinstance(curr_val, bool):
                        setattr(self, k, env_val.lower() in ("true", "1", "yes"))
                    elif isinstance(curr_val, int):
                        try:
                            setattr(self, k, int(env_val))
                        except ValueError:
                            pass
                    elif isinstance(curr_val, float):
                        try:
                            setattr(self, k, float(env_val))
                        except ValueError:
                            pass
                    else:
                        setattr(self, k, env_val)
            for k, v in kwargs.items():
                setattr(self, k, v)

    def Field(default=None, **kwargs):
        return default

    EmailStr = str
