# --description--

Build the room allocation rule as one function. The paper says a student becomes eligible once fees are cleared, then gets a vacant bed space in a block matching their gender and level. Later, the real server applies this rule with a database. Here you write it in `allocation.py` on plain Python data: dictionaries and lists that use the field names of the IHMS <a href="/reference/schema" target="_blank" rel="noopener">Database schema</a>. The file starts with the sample hostels, rooms and bed spaces from that page, so you can try your function with `print`. Use the user stories as your checklist: when every test passes, the lab is done.

| Parameter | What it is | Fields |
|---|---|---|
| `user` | The student applying | `id`, `gender` (`"male"` or `"female"`), `level`, `fees_cleared` |
| `hostels` | A list of hostel blocks | `id`, `name`, `gender`, `level` |
| `rooms` | A list of rooms | `id`, `hostel_id`, `number` |
| `bed_spaces` | A list of bed spaces | `id`, `room_id`, `label` |
| `allocations` | A list of bed spaces already given | `student_id`, `bed_space_id`, `status` (`"active"` or `"ended"`) |

# --user-stories--

1. Your file defines a function called `apply_for_bed` with five parameters, in this order: `user`, `hostels`, `rooms`, `bed_spaces` and `allocations`.
2. The function returns a dictionary with two keys, `"allocation"` and `"reason"`. When the student gets a bed space, `"reason"` is `None`. When the student is refused, `"allocation"` is `None`.
3. A student whose `fees_cleared` is `False` is refused with the reason `Your fees haven't been cleared yet`, even when bed spaces are vacant.
4. A student whose fees are cleared gets an `"allocation"`: a dictionary with `student_id` (the student's `id`), `bed_space_id` and `status` set to `"active"`.
5. The bed space is in a room that belongs to a hostel with the same `gender` as the student.
6. That hostel also has the same `level` as the student.
7. A bed space that has an allocation with `status` `"active"` is taken, and it is never given again.
8. A bed space whose allocations have all `"ended"` is vacant again and can be given.
9. When several vacant bed spaces match, the function gives the first one in the `bed_spaces` list.
10. When no vacant bed space matches the student's gender and level, the student is refused with the reason `No vacant bed space matches your gender and level`.
11. A student who already has an `"active"` allocation is refused with the reason `You already have a bed space, or this one was just taken. Try again.`
12. The function does not change the data it is given. It returns the new allocation, and the caller adds it to the list.

# --hints--

Your code should define a function called `apply_for_bed`.

```py
assert has_function('apply_for_bed')
```

Your function should take five parameters, in this order: `user`, `hostels`, `rooms`, `bed_spaces` and `allocations`.

```py
import ast
_fn = next(n for n in ast.walk(_tree) if isinstance(n, ast.FunctionDef) and n.name == 'apply_for_bed')
assert [a.arg for a in _fn.args.args] == ['user', 'hostels', 'rooms', 'bed_spaces', 'allocations']
```

Your function should return a dictionary with two keys: `"allocation"` and `"reason"`.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_r = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, [])
assert isinstance(_r, dict)
assert set(_r) == {'allocation', 'reason'}
```

A student whose fees are not cleared should get no allocation: `"allocation"` should be `None`, even though bed spaces are vacant.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_r = apply_for_bed(dict(_amina, fees_cleared=False), HOSTELS, ROOMS, BED_SPACES, [])
assert _r['allocation'] is None
```

The reason for a student whose fees are not cleared should be `Your fees haven't been cleared yet`. Check the spelling and the apostrophe.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_r = apply_for_bed(dict(_amina, fees_cleared=False), HOSTELS, ROOMS, BED_SPACES, [])
assert _r['reason'] == "Your fees haven't been cleared yet"
```

A student whose fees are cleared, with a vacant bed space in a matching hostel, should get an allocation, and `"reason"` should be `None`.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_r = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, [])
assert _r['allocation'] is not None
assert _r['reason'] is None
```

The allocation should be a dictionary with the keys `student_id` (the student's `id`), `bed_space_id` and `status`, and `status` should be `"active"`.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_a = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, [])['allocation']
assert set(_a) == {'student_id', 'bed_space_id', 'status'}
assert _a['student_id'] == 1
assert _a['status'] == 'active'
```

A student should get a bed space in a hostel of their own gender. Block A is female and has bed spaces 1 to 4. Block B is male and has bed spaces 5 to 8.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_a = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, [])['allocation']
assert _a is not None and _a['bed_space_id'] in [1, 2, 3, 4]
_b = apply_for_bed(_chika, HOSTELS, ROOMS, BED_SPACES, [])['allocation']
assert _b is not None and _b['bed_space_id'] in [5, 6, 7, 8]
```

A student should get a bed space in a hostel of their own level. With a female level 200 hostel added (bed space 9), a level 200 student should get bed space 9 and a level 100 student should not.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_hostels = HOSTELS + [{'id': 3, 'name': 'Block C', 'gender': 'female', 'level': 200}]
_rooms = ROOMS + [{'id': 5, 'hostel_id': 3, 'number': 'C-101'}]
_beds = BED_SPACES + [{'id': 9, 'room_id': 5, 'label': '1'}]
_a = apply_for_bed(dict(_amina, level=200), _hostels, _rooms, _beds, [])['allocation']
assert _a is not None and _a['bed_space_id'] == 9
_b = apply_for_bed(_amina, _hostels, _rooms, _beds, [])['allocation']
assert _b is not None and _b['bed_space_id'] in [1, 2, 3, 4]
```

A bed space with an `"active"` allocation is taken. Bed space 1 is taken here, so it should not be given again.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_taken = [{'student_id': 10, 'bed_space_id': 1, 'status': 'active'}]
_a = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _taken)['allocation']
assert _a is not None and _a['bed_space_id'] != 1
```

An allocation with the status `"ended"` no longer holds its bed space. Here all four bed spaces of Block A have an ended allocation, so one of them should be given.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_ended = [{'student_id': 10 + i, 'bed_space_id': i, 'status': 'ended'} for i in [1, 2, 3, 4]]
_a = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _ended)['allocation']
assert _a is not None and _a['bed_space_id'] in [1, 2, 3, 4]
```

When several bed spaces are vacant and match, give the first one in the `bed_spaces` list. With nothing taken, Amina should get bed space 1. With bed space 1 taken, she should get bed space 2.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_a = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, [])['allocation']
assert _a is not None and _a['bed_space_id'] == 1
_taken = [{'student_id': 10, 'bed_space_id': 1, 'status': 'active'}]
_b = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _taken)['allocation']
assert _b is not None and _b['bed_space_id'] == 2
```

"First" means first in the `bed_spaces` list that the function is given, not the lowest `id`. With the list reversed, the first match for Amina is bed space 4.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_a = apply_for_bed(_amina, HOSTELS, ROOMS, list(reversed(BED_SPACES)), [])['allocation']
assert _a is not None and _a['bed_space_id'] == 4
```

When every bed space in Block A is taken, Amina should get no allocation: `"allocation"` should be `None`, even though Block B has vacant bed spaces.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_full = [{'student_id': 10 + i, 'bed_space_id': i, 'status': 'active'} for i in [1, 2, 3, 4]]
_r = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _full)
assert _r['allocation'] is None
```

When no vacant bed space matches, the reason should be `No vacant bed space matches your gender and level`. Check this for a student whose matching block is full, and for a level 300 student, when no block has level 300.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_full = [{'student_id': 10 + i, 'bed_space_id': i, 'status': 'active'} for i in [1, 2, 3, 4]]
assert apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _full)['reason'] == 'No vacant bed space matches your gender and level'
assert apply_for_bed(dict(_amina, level=300), HOSTELS, ROOMS, BED_SPACES, [])['reason'] == 'No vacant bed space matches your gender and level'
```

A student who already has an `"active"` allocation should get no second bed space: `"allocation"` should be `None`.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_mine = [{'student_id': 1, 'bed_space_id': 1, 'status': 'active'}]
_r = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _mine)
assert _r['allocation'] is None
```

The reason for a student who already has a bed space should be `You already have a bed space, or this one was just taken. Try again.`

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_mine = [{'student_id': 1, 'bed_space_id': 1, 'status': 'active'}]
assert apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _mine)['reason'] == 'You already have a bed space, or this one was just taken. Try again.'
```

A student whose earlier allocation has `"ended"` has no bed space now, and should be able to get one.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
_old = [{'student_id': 1, 'bed_space_id': 1, 'status': 'ended'}]
_r = apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _old)
assert _r['allocation'] is not None and _r['reason'] is None
```

Your function should not change the data it is given. Return the new allocation, and leave it to the caller to add it to `allocations`.

```py
_amina = {"id": 1, "gender": "female", "level": 100, "fees_cleared": True}
_chika = {"id": 2, "gender": "male", "level": 100, "fees_cleared": True}
import copy
_allocs = [{'student_id': 10, 'bed_space_id': 1, 'status': 'active'}]
_before = copy.deepcopy((_amina, HOSTELS, ROOMS, BED_SPACES, _allocs))
apply_for_bed(_amina, HOSTELS, ROOMS, BED_SPACES, _allocs)
assert (_amina, HOSTELS, ROOMS, BED_SPACES, _allocs) == _before
```

# --seed--

## --seed-contents--

```python file=allocation.py
# Room allocation: the rule from section 3.3 of the paper (flow F1).
# Sample data from the IHMS database. Use it to try your function.

HOSTELS = [
    {"id": 1, "name": "Block A", "gender": "female", "level": 100},
    {"id": 2, "name": "Block B", "gender": "male", "level": 100},
]

ROOMS = [
    {"id": 1, "hostel_id": 1, "number": "A-101"},
    {"id": 2, "hostel_id": 1, "number": "A-102"},
    {"id": 3, "hostel_id": 2, "number": "B-101"},
    {"id": 4, "hostel_id": 2, "number": "B-102"},
]

BED_SPACES = [
    {"id": 1, "room_id": 1, "label": "1"},
    {"id": 2, "room_id": 1, "label": "2"},
    {"id": 3, "room_id": 2, "label": "1"},
    {"id": 4, "room_id": 2, "label": "2"},
    {"id": 5, "room_id": 3, "label": "1"},
    {"id": 6, "room_id": 3, "label": "2"},
    {"id": 7, "room_id": 4, "label": "1"},
    {"id": 8, "room_id": 4, "label": "2"},
]

--editable-region--

--editable-region--
```

# --solutions--

```python file=allocation.py
# Room allocation: the rule from section 3.3 of the paper (flow F1).
# Sample data from the IHMS database. Use it to try your function.

HOSTELS = [
    {"id": 1, "name": "Block A", "gender": "female", "level": 100},
    {"id": 2, "name": "Block B", "gender": "male", "level": 100},
]

ROOMS = [
    {"id": 1, "hostel_id": 1, "number": "A-101"},
    {"id": 2, "hostel_id": 1, "number": "A-102"},
    {"id": 3, "hostel_id": 2, "number": "B-101"},
    {"id": 4, "hostel_id": 2, "number": "B-102"},
]

BED_SPACES = [
    {"id": 1, "room_id": 1, "label": "1"},
    {"id": 2, "room_id": 1, "label": "2"},
    {"id": 3, "room_id": 2, "label": "1"},
    {"id": 4, "room_id": 2, "label": "2"},
    {"id": 5, "room_id": 3, "label": "1"},
    {"id": 6, "room_id": 3, "label": "2"},
    {"id": 7, "room_id": 4, "label": "1"},
    {"id": 8, "room_id": 4, "label": "2"},
]


def hostel_of(bed: dict, rooms: list, hostels: list) -> dict | None:
    """Return the hostel that a bed space belongs to."""
    for room in rooms:
        if room["id"] == bed["room_id"]:
            for hostel in hostels:
                if hostel["id"] == room["hostel_id"]:
                    return hostel
    return None


def apply_for_bed(user: dict, hostels: list, rooms: list, bed_spaces: list, allocations: list) -> dict:
    if not user["fees_cleared"]:
        return {"allocation": None, "reason": "Your fees haven't been cleared yet"}

    taken = []
    for allocation in allocations:
        if allocation["status"] == "active":
            taken.append(allocation["bed_space_id"])

    for bed in bed_spaces:
        if bed["id"] not in taken:
            hostel = hostel_of(bed, rooms, hostels)
            if hostel is not None and hostel["gender"] == user["gender"] and hostel["level"] == user["level"]:
                for allocation in allocations:
                    if allocation["student_id"] == user["id"] and allocation["status"] == "active":
                        return {"allocation": None, "reason": 'You already have a bed space, or this one was just taken. Try again.'}
                return {
                    "allocation": {"student_id": user["id"], "bed_space_id": bed["id"], "status": "active"},
                    "reason": None,
                }
    return {"allocation": None, "reason": 'No vacant bed space matches your gender and level'}
```

# --help--

## --hint--

Do the cheap check first. A student whose fees are not cleared is refused before you look at any bed space. Write each refusal as a `return` of the dictionary, so the function stops there.

## --hint--

A bed space does not say which hostel it is in. Follow the ids: a bed space has a `room_id`, which is the `id` of a room, and that room has a `hostel_id`, which is the `id` of a hostel. A small helper function that finds the hostel of a bed space keeps `apply_for_bed` short.

## --hint--

Work out which bed spaces are taken before you look for a free one, and count only the allocations whose `status` is `"active"`. Python's `in` works on lists as well as on text: `3 in [1, 3]` is `True`. Then go through `bed_spaces` in order and stop at the first bed space that is free and matches.
